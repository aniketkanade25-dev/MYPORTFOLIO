from unittest.mock import patch

from django.test import TestCase, override_settings

from .models import ContactMessage


class PortfolioPageTests(TestCase):
	def test_home_page_renders_sections_in_order(self):
		response = self.client.get("/")

		self.assertEqual(response.status_code, 200)
		html = response.content.decode()
		section_ids = ["landing", "hero", "about", "skills", "technologies", "projects", "contact"]
		positions = [html.index(f'id="{section_id}"') for section_id in section_ids]
		self.assertEqual(positions, sorted(positions))


class ContactViewTests(TestCase):
	def setUp(self):
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
