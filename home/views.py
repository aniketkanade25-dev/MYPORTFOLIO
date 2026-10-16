import hashlib
import json
import logging
import time
from xml.sax.saxutils import escape as escape_xml

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.core.validators import validate_email
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.templatetags.static import static
from django.utils.html import escape
from django.utils.safestring import mark_safe

from brevo import Brevo
from brevo.transactional_emails import (
    SendTransacEmailRequestSender,
    SendTransacEmailRequestToItem,
    SendTransacEmailRequestReplyTo,
)

from .models import Project, ContactMessage
from .templatetags.portfolio_tags import split_tags

logger = logging.getLogger(__name__)
CONTACT_RATE_LIMIT = 5
CONTACT_RATE_WINDOW_SECONDS = 60 * 60
CONTACT_MIN_DWELL_SECONDS = 3
CONTACT_MESSAGE_MAX_LENGTH = 1200

SKILL_TECHNOLOGIES = {
    "frontend": ["HTML", "CSS", "JavaScript", "Responsive Design"],
    "backend": ["Python", "Django", "Django REST Framework", "REST APIs", "SQLite", "PostgreSQL"],
    "data_science": ["Python", "NumPy", "Pandas", "Matplotlib", "Scikit-learn", "Machine Learning"],
    "ai": ["Artificial Intelligence", "AI Applications", "Automation", "APIs"],
    "iot": ["Arduino", "ESP32", "Sensors", "Embedded Systems", "IoT Applications"],
    "tools": ["Git", "GitHub", "VS Code", "Linux", "Figma"],
}

# REPLACE WITH MY REAL JOURNEY
LEARNING_JOURNEY = [
    {
        "year": "YEAR",
        "title": "EXAMPLE ENTRY 1",
        "description": "Replace this line with a real learning milestone.",
    },
    {
        "year": "YEAR",
        "title": "EXAMPLE ENTRY 2",
        "description": "Replace this line with a real learning milestone.",
    },
    {
        "year": "YEAR",
        "title": "EXAMPLE ENTRY 3",
        "description": "Replace this line with a real learning milestone.",
    },
]

def contact_response(success, message, status=200):
    return JsonResponse({"success": success, "message": message}, status=status)


def site_url_for(request):
    configured_url = getattr(settings, "SITE_URL", "").strip().rstrip("/")
    return f"{configured_url}/" if configured_url else request.build_absolute_uri("/")


def is_contact_rate_limited(request):
    client_ip = request.META.get("REMOTE_ADDR", "unknown")
    client_hash = hashlib.sha256(client_ip.encode("utf-8")).hexdigest()
    cache_key = f"portfolio-contact:{client_hash}"
    cache.add(cache_key, 0, timeout=CONTACT_RATE_WINDOW_SECONDS)
    try:
        submission_count = cache.incr(cache_key)
    except ValueError:
        cache.set(cache_key, 1, timeout=CONTACT_RATE_WINDOW_SECONDS)
        submission_count = 1
    return submission_count > CONTACT_RATE_LIMIT


def person_schema_json(canonical_url):
    person = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Aniket Kanade",
        "jobTitle": "Python Developer",
        "url": canonical_url,
        "sameAs": [
            "https://github.com/aniketkanade25-dev",
            "https://www.linkedin.com/in/aniket-kanade-a9bb90331",
        ],
    }
    serialized = json.dumps(person, ensure_ascii=False)
    serialized = serialized.replace("&", "\\u0026").replace("<", "\\u003C").replace(">", "\\u003E")
    return mark_safe(serialized)


def home(request):
    if request.method == "POST":
        if is_contact_rate_limited(request):
            return contact_response(False, "Too many messages. Please try again later.", 429)

        if request.POST.get("website", "").strip():
            return contact_response(False, "Unable to process this submission.", 400)

        form_started_at = request.session.get("contact_form_started_at")
        try:
            page_duration = time.time() - float(form_started_at)
        except (TypeError, ValueError):
            page_duration = 0
        if page_duration < CONTACT_MIN_DWELL_SECONDS:
            return contact_response(False, "Please take a moment to review your message before sending.", 400)

        name = request.POST.get("name", "").strip()
        email = request.POST.get("email", "").strip()
        subject = request.POST.get("subject", "").strip()
        message = request.POST.get("message", "").strip()

        if not all((name, email, subject, message)):
            return contact_response(False, "Please complete every field.", 400)

        if len(name) > 100 or len(email) > 254 or len(subject) > 200 or len(message) > CONTACT_MESSAGE_MAX_LENGTH:
            return contact_response(False, "One or more fields are too long.", 400)

        try:
            validate_email(email)
        except ValidationError:
            return contact_response(False, "Enter a valid email address.", 400)

        try:
            # Save first so an email outage never loses the enquiry.
            ContactMessage.objects.create(
                name=name,
                email=email,
                subject=subject,
                message=message,
            )
        except Exception:
            logger.exception("Could not save a portfolio contact message.")
            return contact_response(False, "Your message could not be saved. Please try again.", 500)

        if not settings.BREVO_API_KEY:
            return contact_response(
                True,
                "Your message was saved, but email notifications are not configured.",
            )

        try:
            client = Brevo(api_key=settings.BREVO_API_KEY)
        except Exception:
            logger.exception("Could not initialize the Brevo client.")
            return contact_response(
                True,
                "Your message was saved, but email notifications could not be sent.",
            )

        escaped_message = escape(message).replace("\n", "<br>")
        notification_sent = False
        reply_sent = False

        try:
            client.transactional_emails.send_transac_email(
                subject=f"New Portfolio Enquiry: {subject}",
                html_content=f"""
                    <html><body>
                        <h2>New Portfolio Enquiry</h2>
                        <p><strong>Name:</strong> {escape(name)}</p>
                        <p><strong>Email:</strong> {escape(email)}</p>
                        <p><strong>Subject:</strong> {escape(subject)}</p>
                        <h3>Message</h3>
                        <p>{escaped_message}</p>
                    </body></html>
                """,
                sender=SendTransacEmailRequestSender(
                    name="Aniket Kanade",
                    email="aniketkanade2121@gmail.com",
                ),
                to=[SendTransacEmailRequestToItem(
                    email="aniketkanade2121@gmail.com",
                    name="Aniket Kanade",
                )],
                reply_to=SendTransacEmailRequestReplyTo(email=email, name=name),
            )
            notification_sent = True
        except Exception:
            logger.exception("Brevo failed to send the portfolio notification.")

        try:
            client.transactional_emails.send_transac_email(
                subject="Thanks for contacting Aniket Kanade",
                html_content=f"""
                    <html><body>
                        <h2>Thank you, {escape(name)}!</h2>
                        <p>Thanks for contacting me through my portfolio.</p>
                        <p>I have received your message and will get back to you as soon as possible.</p>
                        <p>Best regards,<br><strong>Aniket Kanade</strong></p>
                    </body></html>
                """,
                sender=SendTransacEmailRequestSender(
                    name="Aniket Kanade",
                    email="aniket.kanade25@mmit.edu.in",
                ),
                to=[SendTransacEmailRequestToItem(email=email, name=name)],
            )
            reply_sent = True
        except Exception:
            logger.exception("Brevo failed to send the contact auto-reply.")

        if notification_sent and reply_sent:
            return contact_response(True, "Your message was sent successfully.")

        return contact_response(
            True,
            "Your message was saved, but one or more email notifications could not be sent.",
        )

    if request.method != "GET":
        return contact_response(False, "This request method is not supported.", 405)

    request.session["contact_form_started_at"] = time.time()
    projects = Project.objects.all()
    project_tag_sets = [
        {tag.casefold() for tag in split_tags(project.technologies) if tag}
        for project in projects
    ]
    skill_project_matches = {}
    for skill_key, technologies in SKILL_TECHNOLOGIES.items():
        matched_technologies = [
            technology
            for technology in technologies
            if any(technology.casefold() in tags for tags in project_tag_sets)
        ]
        matched_project_count = sum(
            any(technology.casefold() in tags for technology in technologies)
            for tags in project_tag_sets
        )
        if matched_project_count:
            skill_project_matches[skill_key] = {
                "count": matched_project_count,
                "technologies": matched_technologies,
            }

    project_categories = (
        Project.objects.exclude(category="")
        .values_list("category", flat=True)
        .distinct()
        .order_by("category")
    )
    canonical_url = site_url_for(request)
    profile_image_url = f"{canonical_url.rstrip('/')}{static('images/profile.jpg')}"
    return render(
        request,
        "home.html",
        {
            "projects": projects,
            "project_categories": project_categories,
            "skill_project_matches": skill_project_matches,
            "learning_journey": LEARNING_JOURNEY,
            "canonical_url": canonical_url,
            "page_title": "Aniket Kanade | Python Developer",
            "meta_description": "Aniket Kanade | Python Developer.",
            "profile_image_url": profile_image_url,
            "person_schema_json": person_schema_json(canonical_url),
        },
    )


def custom_404(request, exception):
    return render(request, "404.html", status=404)


def robots_txt(request):
    canonical_url = site_url_for(request)
    content = f"User-agent: *\nAllow: /\nSitemap: {canonical_url}sitemap.xml\n"
    return HttpResponse(content, content_type="text/plain; charset=utf-8")


def sitemap_xml(request):
    canonical_url = escape_xml(site_url_for(request))
    content = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"<url><loc>{canonical_url}</loc></url>"
        "</urlset>"
    )
    return HttpResponse(content, content_type="application/xml; charset=utf-8")