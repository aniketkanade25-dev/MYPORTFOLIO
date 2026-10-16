from django.db import models

# Create your models here.
class Project(models.Model):

    title = models.CharField(max_length=200)

    category = models.CharField(max_length=100)

    description = models.TextField()

    problem = models.TextField(blank=True, default="")

    approach = models.TextField(blank=True, default="")

    outcome = models.TextField(blank=True, default="")

    featured = models.BooleanField(default=False)

    technologies = models.CharField(max_length=300)
    image = models.ImageField(upload_to="projects/", blank=True, null=True)

    github_url = models.URLField(blank=True)

    live_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return self.title
    
class ContactMessage(models.Model):

    name = models.CharField(max_length=100)

    email = models.EmailField()

    subject = models.CharField(max_length=200)

    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.subject}"