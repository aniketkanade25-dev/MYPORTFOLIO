document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const landingScreen = document.getElementById("landing");
    const exploreButton = document.getElementById("exploreBtn");
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    const scrollProgressBar = document.getElementById("scrollProgressBar");

    function updateScrollProgress() {
        if (!scrollProgressBar) {
            return;
        }

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        scrollProgressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    }

    let progressFrame = 0;
    const scheduleProgressUpdate = () => {
        if (progressFrame) {
            return;
        }
        progressFrame = window.requestAnimationFrame(() => {
            progressFrame = 0;
            updateScrollProgress();
        });
    };

    window.addEventListener("scroll", scheduleProgressUpdate, { passive: true });
    window.addEventListener("resize", scheduleProgressUpdate, { passive: true });
    updateScrollProgress();

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const magneticButtons = document.querySelectorAll("[data-magnetic]");
    const projectTitleRows = document.querySelectorAll("[data-project-title]");

    if (finePointer.matches && !prefersReducedMotion) {
        const cursorDot = document.getElementById("customCursorDot");
        const cursorRing = document.getElementById("customCursorRing");
        const cursorElements = [cursorDot, cursorRing].filter(Boolean);
        let pointerX = -100;
        let pointerY = -100;
        let ringX = pointerX;
        let ringY = pointerY;
        let cursorFrame = 0;

        document.body.classList.add("has-custom-cursor");

        function drawCursor() {
            cursorFrame = 0;
            cursorDot?.style.setProperty("--cursor-x", `${pointerX}px`);
            cursorDot?.style.setProperty("--cursor-y", `${pointerY}px`);
            ringX += (pointerX - ringX) * 0.2;
            ringY += (pointerY - ringY) * 0.2;
            cursorRing?.style.setProperty("--cursor-x", `${ringX}px`);
            cursorRing?.style.setProperty("--cursor-y", `${ringY}px`);

            if (Math.abs(pointerX - ringX) > 0.5 || Math.abs(pointerY - ringY) > 0.5) {
                cursorFrame = window.requestAnimationFrame(drawCursor);
            }
        }

        document.addEventListener("pointermove", (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;
            document.body.classList.add("cursor-visible");

            const target = event.target instanceof Element ? event.target : null;
            const isFormField = target?.closest("input, textarea, select, [contenteditable='true']");
            document.body.classList.toggle("cursor-suspended", Boolean(isFormField));

            if (cursorRing) {
                cursorRing.classList.toggle("is-view", Boolean(target?.closest("[data-cursor-view]")));
                cursorRing.classList.toggle("is-hover", Boolean(target?.closest("a, button, [data-project-title]")));
            }

            if (!cursorFrame) {
                cursorFrame = window.requestAnimationFrame(drawCursor);
            }
        }, { passive: true });

        window.addEventListener("pointerout", (event) => {
            if (!event.relatedTarget) {
                document.body.classList.remove("cursor-visible", "cursor-suspended");
                cursorElements.forEach((element) => element.classList.remove("is-view", "is-hover"));
            }
        }, { passive: true });

        let magneticFrame = 0;
        let magneticPointer = { x: -1000, y: -1000 };
        const updateMagneticButtons = () => {
            magneticFrame = 0;
            magneticButtons.forEach((button) => {
                const bounds = button.getBoundingClientRect();
                const centerX = bounds.left + bounds.width / 2;
                const centerY = bounds.top + bounds.height / 2;
                const deltaX = magneticPointer.x - centerX;
                const deltaY = magneticPointer.y - centerY;
                const distance = Math.hypot(deltaX, deltaY);
                const radius = 96;
                const strength = distance < radius ? (1 - distance / radius) * 0.14 : 0;

                button.style.setProperty("--magnetic-x", `${deltaX * strength}px`);
                button.style.setProperty("--magnetic-y", `${deltaY * strength}px`);
            });
        };

        window.addEventListener("pointermove", (event) => {
            magneticPointer = { x: event.clientX, y: event.clientY };
            if (!magneticFrame) {
                magneticFrame = window.requestAnimationFrame(updateMagneticButtons);
            }
        }, { passive: true });

        window.addEventListener("blur", () => {
            magneticButtons.forEach((button) => {
                button.style.setProperty("--magnetic-x", "0px");
                button.style.setProperty("--magnetic-y", "0px");
            });
        });

        projectTitleRows.forEach((titleRow) => {
            const projectCard = titleRow.closest("[data-project-row]");
            let followPointer = { x: 0, y: 0 };
            let projectFrame = 0;

            const updateProjectImage = () => {
                projectFrame = 0;
                projectCard?.style.setProperty("--project-follow-x", `${followPointer.x}px`);
                projectCard?.style.setProperty("--project-follow-y", `${followPointer.y}px`);
            };

            titleRow.addEventListener("pointerenter", () => {
                projectCard?.classList.add("is-following");
            }, { passive: true });

            titleRow.addEventListener("pointermove", (event) => {
                const bounds = titleRow.getBoundingClientRect();
                followPointer = {
                    x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 14,
                    y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 10,
                };
                if (!projectFrame) {
                    projectFrame = window.requestAnimationFrame(updateProjectImage);
                }
            }, { passive: true });

            titleRow.addEventListener("pointerleave", () => {
                projectCard?.classList.remove("is-following");
                followPointer = { x: 0, y: 0 };
                if (!projectFrame) {
                    projectFrame = window.requestAnimationFrame(updateProjectImage);
                }
            }, { passive: true });
        });
    }

    if (landingScreen && exploreButton) {
        exploreButton.addEventListener("click", () => {
            landingScreen.classList.add("exit");
            window.setTimeout(() => {
                landingScreen.hidden = true;
                document.querySelector(".hero-buttons a")?.focus({ preventScroll: true });
            }, prefersReducedMotion ? 0 : 820);
        });
    }

    function setMenuOpen(isOpen, restoreFocus = false) {
        if (!menuToggle || !navLinks) {
            return;
        }

        navLinks.classList.toggle("active", isOpen);
        menuToggle.classList.toggle("active", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");

        if (isOpen) {
            navLinks.querySelector("a")?.focus();
        } else if (restoreFocus) {
            menuToggle.focus();
        }
    }

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
                setMenuOpen(false, true);
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 760 && menuToggle.getAttribute("aria-expanded") === "true") {
                setMenuOpen(false);
            }
        });
    }

    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        const link = event.target.closest('a[href^="#"]');
        if (!link) {
            return;
        }

        const target = document.getElementById(link.hash.slice(1));
        if (!target) {
            return;
        }

        event.preventDefault();

        if (navLinks?.contains(link)) {
            setMenuOpen(false);
        }

        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        window.history.replaceState(null, "", link.hash);
    });

    const skillButtons = document.querySelectorAll(".skill-header[aria-controls]");
    skillButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const isOpen = button.getAttribute("aria-expanded") !== "true";

            skillButtons.forEach((otherButton) => {
                const otherPanel = document.getElementById(otherButton.getAttribute("aria-controls"));
                const otherItem = otherButton.closest(".skill-item");
                const shouldClose = otherButton !== button || !isOpen;

                otherButton.setAttribute("aria-expanded", String(!shouldClose));
                otherItem?.classList.toggle("active", !shouldClose);
                if (otherPanel) {
                    otherPanel.hidden = shouldClose;
                }
            });
        });
    });

    const splitHeadings = document.querySelectorAll(".section-header h2, .tech-heading h2");
    splitHeadings.forEach((heading) => {
        heading.setAttribute("aria-label", heading.textContent.replace(/\s+/g, " ").trim());
        const textWalker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (textWalker.nextNode()) {
            textNodes.push(textWalker.currentNode);
        }

        let wordIndex = 0;
        textNodes.forEach((textNode) => {
            if (!textNode.textContent.trim()) {
                return;
            }

            const fragment = document.createDocumentFragment();
            textNode.textContent.split(/(\s+)/).forEach((part) => {
                if (!part.trim()) {
                    fragment.append(document.createTextNode(part));
                    return;
                }

                const word = document.createElement("span");
                word.className = "split-word";
                word.textContent = part;
                word.style.setProperty("--word-index", wordIndex);
                wordIndex += 1;
                fragment.append(word);
            });
            textNode.replaceWith(fragment);
        });

        heading.classList.add("split-ready");
    });

    const revealTargets = new Set(document.querySelectorAll(
        ".animate-on-scroll, .section-header, .section-header h2, .tech-heading h2, .project-card, .about-content, .skills-list"
    ));
    revealTargets.forEach((element) => element.classList.add("animate-on-scroll"));

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        revealTargets.forEach((element) => element.classList.add("is-visible"));
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    entry.target.classList.remove("reveal-pending");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

        revealTargets.forEach((element) => {
            const bounds = element.getBoundingClientRect();
            const isInView = bounds.top < window.innerHeight && bounds.bottom > 0;

            if (isInView) {
                element.classList.add("is-visible");
            } else {
                element.classList.add("reveal-pending");
                revealObserver.observe(element);
            }
        });
    }

    const navigationLinks = Array.from(document.querySelectorAll('nav a[href^="#"]'));
    const navigationSections = navigationLinks
        .map((link) => document.getElementById(link.hash.slice(1)))
        .filter(Boolean);

    function setActiveNavigation(sectionId) {
        navigationLinks.forEach((link) => {
            const isActive = link.hash === `#${sectionId}`;
            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    if ("IntersectionObserver" in window && navigationSections.length) {
        const navigationObserver = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) {
                return;
            }

            const viewportCenter = window.innerHeight * 0.5;
            const activeSection = navigationSections.find((section) => {
                const bounds = section.getBoundingClientRect();
                return bounds.top <= viewportCenter && bounds.bottom >= viewportCenter;
            });

            if (activeSection) {
                setActiveNavigation(activeSection.id);
            }
        }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });

        navigationSections.forEach((section) => navigationObserver.observe(section));
    }

    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        let isSubmitting = false;
        const submitButton = contactForm.querySelector("button[type='submit']");
        const submitLabel = submitButton?.querySelector(".submit-label");
        const statusMessage = document.getElementById("contactStatus");

        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (isSubmitting || !contactForm.reportValidity()) {
                return;
            }

            isSubmitting = true;
            if (submitButton) {
                submitButton.disabled = true;
            }
            if (submitLabel) {
                submitLabel.textContent = "SENDING...";
            }
            contactForm.setAttribute("aria-busy", "true");
            statusMessage?.classList.remove("is-error");
            if (statusMessage) {
                statusMessage.textContent = "";
            }

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method.toUpperCase(),
                    body: new FormData(contactForm),
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "Accept": "application/json",
                    },
                });
                const result = await response.json().catch(() => null);

                if (!response.ok || !result || typeof result.success !== "boolean") {
                    if (statusMessage) {
                        statusMessage.textContent = result?.message || "Your message could not be processed. Please try again.";
                        statusMessage.classList.add("is-error");
                    }
                    return;
                }

                if (statusMessage) {
                    statusMessage.textContent = result.message;
                    statusMessage.classList.toggle("is-error", !result.success);
                }
                if (result.success) {
                    contactForm.reset();
                }
            } catch {
                if (statusMessage) {
                    statusMessage.textContent = "Unable to send your message right now. Please try again.";
                    statusMessage.classList.add("is-error");
                }
            } finally {
                isSubmitting = false;
                if (submitButton) {
                    submitButton.disabled = false;
                }
                if (submitLabel) {
                    submitLabel.textContent = "SEND MESSAGE";
                }
                contactForm.removeAttribute("aria-busy");
            }
        });
    }
});
