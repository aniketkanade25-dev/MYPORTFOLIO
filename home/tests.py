import time
import xml.etree.ElementTree as ElementTree
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings

from .models import ContactMessage


class PortfolioPageTests(TestCase):
	def test_home_page_renders_sections_in_order(self):
		response = self.client.get("/")

		self.assertEqual(response.status_code, 200)
		html = response.content.decode()
		section_ids = ["landing", "hero", "about", "learningJourney", "skills", "technologies", "projects", "contact"]
		positions = [html.index(f'id="{section_id}"') for section_id in section_ids]
		self.assertEqual(positions, sorted(positions))

	def test_home_page_has_real_seo_and_person_schema(self):
		response = self.client.get("/")
		html = response.content.decode()

		self.assertContains(response, "<title>Aniket Kanade | Python Developer</title>", html=True)
		self.assertContains(response, 'rel="canonical" href="http://testserver/"')
		self.assertContains(response, 'property="og:image"')
		self.assertContains(response, 'name="twitter:card"')
		self.assertIn('"@type": "Person"', html)
		self.assertIn('"jobTitle": "Python Developer"', html)

	@override_settings(DEBUG=False)
	def test_custom_404_page_is_rendered(self):
		response = self.client.get("/this-page-does-not-exist/")

		self.assertEqual(response.status_code, 404)
		self.assertContains(response, "PAGE NOT", status_code=404)
		self.assertContains(response, "RETURN HOME", status_code=404)

	def test_robots_and_sitemap_endpoints(self):
		robots = self.client.get("/robots.txt")
		sitemap = self.client.get("/sitemap.xml")

		self.assertEqual(robots.status_code, 200)
		self.assertIn("Sitemap: http://testserver/sitemap.xml", robots.content.decode())
		self.assertEqual(sitemap.status_code, 200)
		root = ElementTree.fromstring(sitemap.content)
		location = root.find("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
		self.assertEqual(location.text, "http://testserver/")


class ContactViewTests(TestCase):
	def setUp(self):
		cache.clear()
		self.client.get("/")
		session = self.client.session
		session["contact_form_started_at"] = time.time() - 10
		session.save()
		self.form_data = {
			"name": "Example Visitor",
			"email": "visitor@example.com",
			"subject": "Portfolio question",
			"message": "Hello, Aniket.",
		}

	def test_invalid_email_is_rejected_without_saving(self):
		self.form_data["email"] = "not-an-email"

		response = self.client.post("/", self.form_data)

		self.assertEqual(response.status_code, 400)
		self.assertEqual(response.json()["success"], False)
		self.assertEqual(ContactMessage.objects.count(), 0)

	def test_honeypot_submission_is_rejected_without_saving(self):
		self.form_data["website"] = "https://spam.example"

		response = self.client.post("/", self.form_data)

		self.assertEqual(response.status_code, 400)
		self.assertEqual(set(response.json()), {"success", "message"})
		self.assertFalse(response.json()["success"])
		self.assertEqual(ContactMessage.objects.count(), 0)

	def test_submission_too_soon_after_page_load_is_rejected(self):
		session = self.client.session
		session["contact_form_started_at"] = time.time()
		session.save()

		response = self.client.post("/", self.form_data)

		self.assertEqual(response.status_code, 400)
		self.assertIn("take a moment", response.json()["message"])
		self.assertEqual(ContactMessage.objects.count(), 0)

	@override_settings(BREVO_API_KEY="")
	def test_rate_limit_rejects_sixth_submission_from_same_ip(self):
		for _ in range(5):
			response = self.client.post("/", self.form_data, REMOTE_ADDR="198.51.100.14")
			self.assertEqual(response.status_code, 200)

		response = self.client.post("/", self.form_data, REMOTE_ADDR="198.51.100.14")

		self.assertEqual(response.status_code, 429)
		self.assertFalse(response.json()["success"])
		self.assertEqual(ContactMessage.objects.count(), 5)

	@override_settings(BREVO_API_KEY="test-api-key")
	@patch("home.views.Brevo")
	def test_success_sends_notification_and_auto_reply(self, brevo_class):
		response = self.client.post("/", self.form_data)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["success"], True)
		self.assertIn("sent successfully", response.json()["message"])
		self.assertEqual(ContactMessage.objects.count(), 1)
		self.assertEqual(
			brevo_class.return_value.transactional_emails.send_transac_email.call_count,
			2,
		)

	@override_settings(BREVO_API_KEY="test-api-key")
	@patch("home.views.Brevo")
	def test_brevo_failure_keeps_message_and_reports_failure(self, brevo_class):
		brevo_class.return_value.transactional_emails.send_transac_email.side_effect = RuntimeError(
			"Brevo unavailable"
		)

		response = self.client.post("/", self.form_data)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json()["success"], True)
		self.assertIn("saved", response.json()["message"])
		self.assertIn("could not be sent", response.json()["message"])
		self.assertEqual(ContactMessage.objects.count(), 1)
		self.assertEqual(
			brevo_class.return_value.transactional_emails.send_transac_email.call_count,
			2,
		)
