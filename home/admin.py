from django.contrib import admin
from .models import Project, ContactMessage


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
	list_display = ("title", "category", "featured", "created_at")
	list_filter = ("category", "featured")
	search_fields = (
		"title",
		"category",
		"description",
		"problem",
		"approach",
		"outcome",
		"technologies",
	)
	fieldsets = (
		("Project", {
			"fields": (
				"title",
				"category",
				"description",
				"technologies",
				"image",
				"github_url",
				"live_url",
			),
		}),
		("Case study", {
			"fields": ("problem", "approach", "outcome", "featured"),
		}),
	)


admin.site.register(ContactMessage)