import logging

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.shortcuts import render
from django.utils.html import escape

from brevo import Brevo
from brevo.transactional_emails import (
    SendTransacEmailRequestSender,
    SendTransacEmailRequestToItem,
    SendTransacEmailRequestReplyTo,
)

from .models import Project, ContactMessage

logger = logging.getLogger(__name__)

def contact_response(success, message, status=200):
    return JsonResponse({"success": success, "message": message}, status=status)


def home(request):
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        email = request.POST.get("email", "").strip()
        subject = request.POST.get("subject", "").strip()
        message = request.POST.get("message", "").strip()

        if not all((name, email, subject, message)):
            return contact_response(False, "Please complete every field.", 400)

        if len(name) > 100 or len(subject) > 200:
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

    projects = Project.objects.all()
    return render(request, "home.html", {"projects": projects})