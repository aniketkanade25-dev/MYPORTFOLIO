document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const landingScreen = document.getElementById("landing");
    const exploreButton = document.getElementById("exploreBtn");
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    const scrollProgressBar = document.getElementById("scrollProgressBar");

    function updateScrollProgress() {
        document.body.classList.toggle("has-scrolled", window.scrollY > 40);
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

    const indiaTime = document.getElementById("indiaTime");
    if (indiaTime) {
        const indiaClock = new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        });
        const updateIndiaTime = () => {
            const now = new Date();
            indiaTime.textContent = `${indiaClock.format(now)} IST`;
            indiaTime.dateTime = now.toISOString();
        };

        updateIndiaTime();
        window.setInterval(updateIndiaTime, 1000);
    }

    const roleRotator = document.getElementById("roleRotator");
    const rotatingRole = document.getElementById("rotatingRole");
    if (roleRotator && rotatingRole && !prefersReducedMotion) {
        const roles = [
            "DJANGO DEVELOPER",
            "DATA SCIENCE ENTHUSIAST",
            "ML & AI LEARNER",
            "IoT TINKERER",
        ];
        let roleIndex = 0;
        let roleTimer = 0;
        let rolePaused = false;

        const scheduleRoleChange = () => {
            window.clearTimeout(roleTimer);
            if (!rolePaused) {
                roleTimer = window.setTimeout(changeRole, 2600);
            }
        };

        const changeRole = () => {
            rotatingRole.classList.add("is-leaving");
            window.setTimeout(() => {
                roleIndex = (roleIndex + 1) % roles.length;
                rotatingRole.textContent = roles[roleIndex];
                rotatingRole.classList.remove("is-leaving");
                rotatingRole.classList.add("is-entering");
                window.requestAnimationFrame(() => {
                    rotatingRole.classList.remove("is-entering");
                });
                scheduleRoleChange();
            }, 360);
        };

        roleRotator.addEventListener("pointerenter", (event) => {
            if (event.pointerType !== "mouse") {
                return;
            }
            rolePaused = true;
            window.clearTimeout(roleTimer);
        }, { passive: true });
        roleRotator.addEventListener("pointerleave", (event) => {
            if (event.pointerType !== "mouse") {
                return;
            }
            rolePaused = false;
            scheduleRoleChange();
        }, { passive: true });
        roleRotator.addEventListener("focusin", () => {
            rolePaused = true;
            window.clearTimeout(roleTimer);
        });
        roleRotator.addEventListener("focusout", () => {
            rolePaused = false;
            scheduleRoleChange();
        });
        scheduleRoleChange();
    }

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

        const hero = document.querySelector(".hero");
        const portrait = document.querySelector(".hero-image");
        if (hero && portrait) {
            let portraitFrame = 0;
            const updatePortraitParallax = () => {
                portraitFrame = 0;
                const parallaxY = Math.min(16, window.scrollY * 0.025);
                portrait.style.setProperty("--portrait-y", `${parallaxY}px`);
            };
            const schedulePortraitParallax = () => {
                if (!portraitFrame) {
                    portraitFrame = window.requestAnimationFrame(updatePortraitParallax);
                }
            };

            window.addEventListener("scroll", schedulePortraitParallax, { passive: true });
            schedulePortraitParallax();

            hero.addEventListener("pointermove", (event) => {
                const bounds = portrait.getBoundingClientRect();
                const horizontalPosition = (event.clientX - bounds.left) / bounds.width - 0.5;
                const verticalPosition = (event.clientY - bounds.top) / bounds.height - 0.5;
                portrait.style.setProperty("--portrait-tilt", `${horizontalPosition * 12}deg`);
                portrait.style.setProperty("--portrait-tilt-x", `${verticalPosition * -4}deg`);
            }, { passive: true });

            hero.addEventListener("pointerleave", () => {
                portrait.style.setProperty("--portrait-tilt", "0deg");
                portrait.style.setProperty("--portrait-tilt-x", "0deg");
            }, { passive: true });
        }
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
        heading.setAttribute("aria-label", heading.innerText.replace(/\s+/g, " ").trim());
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

    const projectStat = document.querySelector("[data-count]");
    if (projectStat) {
        const projectCount = Number(projectStat.dataset.count);
        const setProjectCount = (value) => {
            projectStat.textContent = String(value);
        };

        if (prefersReducedMotion || !("IntersectionObserver" in window)) {
            setProjectCount(projectCount);
        } else {
            setProjectCount(0);
            const countObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    countObserver.unobserve(entry.target);
                    const startTime = performance.now();
                    const duration = 900;

                    const animateCount = (now) => {
                        const progress = Math.min((now - startTime) / duration, 1);
                        setProjectCount(Math.floor(projectCount * progress));
                        if (progress < 1) {
                            window.requestAnimationFrame(animateCount);
                        }
                    };

                    window.requestAnimationFrame(animateCount);
                });
            }, { threshold: 0.5 });

            countObserver.observe(projectStat);
        }
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

    const projectRows = Array.from(document.querySelectorAll("[data-project-row]"));
    const categoryButtons = document.querySelectorAll("[data-category-filter]");
    const clearProjectFilter = document.getElementById("clearProjectFilter");
    const noFilteredProjects = document.getElementById("noFilteredProjects");
    const projectDialog = document.getElementById("projectDialog");
    const projectDialogTitle = document.getElementById("projectDialogTitle");
    const projectDialogContent = document.getElementById("projectDialogContent");
    const projectDialogPosition = document.getElementById("projectDialogPosition");
    const projectDialogClose = document.getElementById("projectDialogClose");
    const previousProject = document.getElementById("previousProject");
    const nextProject = document.getElementById("nextProject");
    const backToTop = document.getElementById("backToTop");
    const copyToast = document.getElementById("copyToast");
    let selectedCategory = "all";
    let selectedTechnology = "";
    let filterVersion = 0;
    let activeProjectRow = null;
    let projectReturnFocus = null;
    let copyToastTimer = 0;

    function normalizeTechnology(value) {
        return (value || "").trim().toLocaleLowerCase();
    }

    function applyProjectFilters(scrollToProjects = false) {
        const currentVersion = ++filterVersion;
        let visibleCount = 0;

        projectRows.forEach((row) => {
            const categoryMatches = selectedCategory === "all"
                || normalizeTechnology(row.dataset.projectCategory) === selectedCategory;
            const techButtons = Array.from(row.querySelectorAll(".project-tech-filter"));
            const technologyMatches = !selectedTechnology
                || techButtons.some((button) => normalizeTechnology(button.dataset.techFilter) === selectedTechnology);
            const matches = categoryMatches && technologyMatches;

            if (matches) {
                visibleCount += 1;
                row.hidden = false;
                row.classList.remove("is-filtering-out");
            } else {
                row.classList.add("is-filtering-out");
                window.setTimeout(() => {
                    if (currentVersion === filterVersion) {
                        row.hidden = true;
                    }
                }, prefersReducedMotion ? 0 : 220);
            }
        });

        categoryButtons.forEach((button) => {
            const isSelected = normalizeTechnology(button.dataset.categoryFilter) === selectedCategory;
            button.classList.toggle("is-selected", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));
        });

        document.querySelectorAll("[data-tech-filter]").forEach((button) => {
            const isSelected = normalizeTechnology(button.dataset.techFilter) === selectedTechnology;
            button.setAttribute("aria-pressed", String(Boolean(selectedTechnology) && isSelected));
        });

        if (clearProjectFilter) {
            clearProjectFilter.hidden = selectedCategory === "all" && !selectedTechnology;
        }
        if (noFilteredProjects) {
            noFilteredProjects.hidden = visibleCount > 0 || projectRows.length === 0;
        }
        if (activeProjectRow?.hidden && projectDialog?.open) {
            projectDialog.close();
        }

        if (scrollToProjects) {
            document.getElementById("projects")?.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "start",
            });
        }
    }

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectedCategory = normalizeTechnology(button.dataset.categoryFilter) || "all";
            selectedTechnology = "";
            applyProjectFilters();
        });
    });

    clearProjectFilter?.addEventListener("click", () => {
        selectedCategory = "all";
        selectedTechnology = "";
        applyProjectFilters();
    });

    function getVisibleProjectRows() {
        return projectRows.filter((row) => !row.hidden);
    }

    function trapDialogFocus(dialog, event) {
        if (event.key !== "Tab") {
            return;
        }

        const focusable = Array.from(dialog.querySelectorAll(
            "button:not(:disabled), input:not(:disabled), a[href], [tabindex='0']"
        )).filter((element) => !element.hidden);
        if (!focusable.length) {
            event.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function renderProjectDetails(row) {
        if (!projectDialog || !row) {
            return;
        }

        activeProjectRow = row;
        const titleButton = row.querySelector(".project-title-wrap h3 .project-open");
        projectDialogTitle.textContent = titleButton?.textContent.trim() || "Project details";
        const detailTemplate = row.querySelector(".project-detail-template");
        projectDialogContent.replaceChildren(detailTemplate.content.cloneNode(true));

        const visibleRows = getVisibleProjectRows();
        const currentPosition = visibleRows.indexOf(row);
        projectDialogPosition.textContent = `${currentPosition + 1} / ${visibleRows.length}`;
        previousProject.disabled = visibleRows.length < 2;
        nextProject.disabled = visibleRows.length < 2;
    }

    function openProjectDialog(row, returnFocus = document.activeElement) {
        if (!projectDialog || !row || typeof projectDialog.showModal !== "function") {
            return;
        }

        projectReturnFocus = returnFocus;
        renderProjectDetails(row);
        if (!projectDialog.open) {
            projectDialog.showModal();
        }
        projectDialogClose?.focus();
    }

    function moveProjectDialog(direction) {
        const visibleRows = getVisibleProjectRows();
        if (visibleRows.length < 2 || !activeProjectRow) {
            return;
        }

        const currentPosition = visibleRows.indexOf(activeProjectRow);
        const nextPosition = (currentPosition + direction + visibleRows.length) % visibleRows.length;
        renderProjectDetails(visibleRows[nextPosition]);
    }

    projectDialogClose?.addEventListener("click", () => projectDialog.close());
    previousProject?.addEventListener("click", () => moveProjectDialog(-1));
    nextProject?.addEventListener("click", () => moveProjectDialog(1));
    projectDialog?.addEventListener("click", (event) => {
        if (event.target === projectDialog) {
            projectDialog.close();
        }
    });
    projectDialog?.addEventListener("cancel", (event) => {
        event.preventDefault();
        projectDialog.close();
    });
    projectDialog?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            projectDialog.close();
            return;
        }
        trapDialogFocus(projectDialog, event);
    });
    projectDialog?.addEventListener("close", () => {
        activeProjectRow = null;
        if (projectReturnFocus?.isConnected) {
            projectReturnFocus.focus();
        }
    });

    async function copyContactEmail() {
        const email = document.querySelector("[data-copy-email]")?.textContent.trim();
        if (!email) {
            return false;
        }

        let copied = false;
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error("Clipboard API is unavailable");
            }
            await navigator.clipboard.writeText(email);
            copied = true;
        } catch {
            const fallback = document.createElement("textarea");
            fallback.value = email;
            fallback.setAttribute("readonly", "");
            fallback.className = "visually-hidden";
            document.body.append(fallback);
            fallback.select();
            try {
                copied = document.execCommand("copy");
            } catch {
                copied = false;
            }
            fallback.remove();
        }

        if (copyToast) {
            window.clearTimeout(copyToastTimer);
            copyToast.textContent = copied ? "Copied" : `Select and copy: ${email}`;
            copyToast.hidden = false;
            copyToastTimer = window.setTimeout(() => {
                copyToast.hidden = true;
            }, 2200);
        }
        return copied;
    }

    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        const techButton = event.target.closest("[data-tech-filter]");
        if (techButton) {
            event.preventDefault();
            selectedCategory = "all";
            selectedTechnology = normalizeTechnology(techButton.dataset.techFilter);
            applyProjectFilters(Boolean(techButton.hasAttribute("data-scroll-project-filter")));
            if (projectDialog?.open) {
                projectDialog.close();
            }
            return;
        }

        const projectButton = event.target.closest("[data-project-open]");
        if (projectButton) {
            const row = projectButton.closest("[data-project-row]");
            if (row) {
                openProjectDialog(row, projectButton);
            }
            return;
        }

        const emailLink = event.target.closest("[data-copy-email]");
        if (emailLink) {
            event.preventDefault();
            copyContactEmail();
        }
    });

    backToTop?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });

    if (backToTop) {
        const updateBackToTop = () => {
            backToTop.hidden = window.scrollY < window.innerHeight;
        };
        window.addEventListener("scroll", updateBackToTop, { passive: true });
        window.addEventListener("resize", updateBackToTop, { passive: true });
        updateBackToTop();
    }

    const commandPalette = document.getElementById("commandPalette");
    const commandPaletteTrigger = document.getElementById("commandPaletteTrigger");
    const commandPaletteInput = document.getElementById("commandPaletteInput");
    const commandPaletteResults = document.getElementById("commandPaletteResults");
    const commandPaletteStatus = document.getElementById("commandPaletteStatus");
    const commandSections = [
        { label: "Home", sectionId: "hero", type: "section" },
        { label: "About", sectionId: "about", type: "section" },
        { label: "Skills", sectionId: "skills", type: "section" },
        { label: "Projects", sectionId: "projects", type: "section" },
        { label: "Contact", sectionId: "contact", type: "section" },
    ];
    const commandActions = [
        { label: "Copy email", type: "action", action: "copy-email" },
        { label: "Open GitHub", type: "action", action: "github" },
        { label: "Open LinkedIn", type: "action", action: "linkedin" },
    ];
    const commandOptions = [
        ...commandSections,
        ...projectRows.map((row) => ({
            label: row.querySelector(".project-title-wrap h3")?.textContent.trim() || "Untitled project",
            type: "project",
            row,
        })),
        ...commandActions,
    ];
    let visibleCommandOptions = [];
    let selectedCommandIndex = 0;
    let commandReturnFocus = null;
    let restoreCommandFocus = true;
    let shortcutReturnFocus = null;

    function openCommandPalette() {
        if (!commandPalette || typeof commandPalette.showModal !== "function") {
            return;
        }
        commandReturnFocus = document.activeElement;
        restoreCommandFocus = true;
        commandPalette.showModal();
        commandPaletteInput.setAttribute("aria-expanded", "true");
        commandPaletteInput.value = "";
        renderCommandOptions();
        commandPaletteInput.focus();
    }

    function closeCommandPalette(restoreFocus = true) {
        if (!commandPalette?.open) {
            return;
        }
        restoreCommandFocus = restoreFocus;
        commandPalette.close();
    }

    function fuzzyMatch(query, value) {
        let queryIndex = 0;
        const normalizedValue = value.toLocaleLowerCase();
        for (const character of query.toLocaleLowerCase()) {
            queryIndex = normalizedValue.indexOf(character, queryIndex);
            if (queryIndex === -1) {
                return false;
            }
            queryIndex += 1;
        }
        return true;
    }

    function selectCommandOption(index) {
        if (!visibleCommandOptions.length) {
            commandPaletteInput.removeAttribute("aria-activedescendant");
            return;
        }
        selectedCommandIndex = (index + visibleCommandOptions.length) % visibleCommandOptions.length;
        const options = commandPaletteResults.querySelectorAll("[role='option']");
        options.forEach((option, optionIndex) => {
            const selected = optionIndex === selectedCommandIndex;
            option.setAttribute("aria-selected", String(selected));
            option.classList.toggle("is-active", selected);
        });
        const activeOption = options[selectedCommandIndex];
        commandPaletteInput.setAttribute("aria-activedescendant", activeOption.id);
        activeOption.scrollIntoView({ block: "nearest" });
    }

    function renderCommandOptions() {
        if (!commandPaletteResults || !commandPaletteInput) {
            return;
        }

        const query = commandPaletteInput.value.trim();
        visibleCommandOptions = commandOptions.filter((option) =>
            !query || fuzzyMatch(query, `${option.label} ${option.type}`)
        );
        commandPaletteResults.replaceChildren();
        visibleCommandOptions.forEach((option, index) => {
            const item = document.createElement("li");
            item.setAttribute("role", "presentation");
            const result = document.createElement("button");
            result.id = `command-option-${index}`;
            result.type = "button";
            result.className = "command-result";
            result.setAttribute("role", "option");
            result.setAttribute("aria-selected", "false");

            const label = document.createElement("span");
            label.textContent = option.label;
            const category = document.createElement("small");
            category.textContent = option.type === "action" ? "QUICK ACTION" : option.type.toUpperCase();
            result.append(label, category);
            item.append(result);
            commandPaletteResults.append(item);
        });

        selectedCommandIndex = 0;
        if (commandPaletteStatus) {
            commandPaletteStatus.textContent = visibleCommandOptions.length
                ? `${visibleCommandOptions.length} result${visibleCommandOptions.length === 1 ? "" : "s"}`
                : "No results found";
        }
        commandPaletteInput.setAttribute("aria-expanded", String(visibleCommandOptions.length > 0));
        if (visibleCommandOptions.length) {
            selectCommandOption(0);
        } else {
            commandPaletteInput.removeAttribute("aria-activedescendant");
        }
    }

    function activateCommandOption(option) {
        if (option.type === "section") {
            closeCommandPalette(false);
            const target = document.getElementById(option.sectionId);
            target?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
            return;
        }

        if (option.type === "project") {
            closeCommandPalette(false);
            window.setTimeout(() => openProjectDialog(option.row, commandPaletteTrigger), 0);
            return;
        }

        closeCommandPalette(false);
        if (option.action === "copy-email") {
            copyContactEmail();
        } else if (option.action === "github" || option.action === "linkedin") {
            const link = document.querySelector(`.contact-links a[href*='${option.action === "github" ? "github.com" : "linkedin.com"}']`);
            if (link) {
                window.open(link.href, "_blank", "noopener,noreferrer");
            }
        }
    }

    commandPaletteTrigger?.addEventListener("click", openCommandPalette);
    commandPaletteInput?.addEventListener("input", renderCommandOptions);
    commandPaletteInput?.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            selectCommandOption(selectedCommandIndex + 1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            selectCommandOption(selectedCommandIndex - 1);
        } else if (event.key === "Enter" && visibleCommandOptions.length) {
            event.preventDefault();
            activateCommandOption(visibleCommandOptions[selectedCommandIndex]);
        }
    });
    commandPaletteResults?.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }
        const result = event.target.closest("[role='option']");
        if (result) {
            const index = Number(result.id.replace("command-option-", ""));
            activateCommandOption(visibleCommandOptions[index]);
        }
    });
    commandPalette?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeCommandPalette();
            return;
        }
        trapDialogFocus(commandPalette, event);
    });
    commandPalette?.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeCommandPalette();
    });
    commandPalette?.addEventListener("click", (event) => {
        if (event.target === commandPalette) {
            closeCommandPalette();
        }
    });
    commandPalette?.addEventListener("close", () => {
        commandPaletteInput?.setAttribute("aria-expanded", "false");
        if (restoreCommandFocus && commandReturnFocus?.isConnected) {
            commandReturnFocus.focus();
        }
    });

    const shortcutHelp = document.getElementById("shortcutHelp");
    const shortcutHelpClose = document.getElementById("shortcutHelpClose");
    const sectionShortcuts = { p: "projects", a: "about", s: "skills", c: "contact" };
    let pendingSectionShortcut = false;
    let sectionShortcutTimer = 0;

    function openShortcutHelp() {
        if (!shortcutHelp || typeof shortcutHelp.showModal !== "function") {
            return;
        }
        shortcutReturnFocus = document.activeElement;
        shortcutHelp.showModal();
        shortcutHelpClose?.focus();
    }

    function closeShortcutHelp() {
        if (shortcutHelp?.open) {
            shortcutHelp.close();
        }
    }

    shortcutHelpClose?.addEventListener("click", closeShortcutHelp);
    shortcutHelp?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeShortcutHelp();
            return;
        }
        trapDialogFocus(shortcutHelp, event);
    });
    shortcutHelp?.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeShortcutHelp();
    });
    shortcutHelp?.addEventListener("click", (event) => {
        if (event.target === shortcutHelp) {
            closeShortcutHelp();
        }
    });
    shortcutHelp?.addEventListener("close", () => {
        if (shortcutReturnFocus?.isConnected) {
            shortcutReturnFocus.focus();
        }
    });

    document.addEventListener("keydown", (event) => {
        const target = event.target;
        const isTyping = target instanceof Element
            && target.closest("input, textarea, select, [contenteditable='true']");

        if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
            if (window.matchMedia("(pointer: coarse)").matches) {
                return;
            }
            event.preventDefault();
            openCommandPalette();
            return;
        }

        if (isTyping || commandPalette?.open || projectDialog?.open || shortcutHelp?.open) {
            return;
        }

        if (event.key === "?") {
            event.preventDefault();
            openShortcutHelp();
            return;
        }

        if (pendingSectionShortcut) {
            pendingSectionShortcut = false;
            window.clearTimeout(sectionShortcutTimer);
            const sectionId = sectionShortcuts[event.key.toLocaleLowerCase()];
            if (sectionId) {
                document.getElementById(sectionId)?.scrollIntoView({
                    behavior: prefersReducedMotion ? "auto" : "smooth",
                });
            }
            return;
        }

        if (event.key.toLocaleLowerCase() === "g") {
            pendingSectionShortcut = true;
            window.clearTimeout(sectionShortcutTimer);
            sectionShortcutTimer = window.setTimeout(() => {
                pendingSectionShortcut = false;
            }, 900);
        }
    });

    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        let isSubmitting = false;
        const submitButton = contactForm.querySelector("button[type='submit']");
        const submitLabel = submitButton?.querySelector(".submit-label");
        const statusMessage = document.getElementById("contactStatus");
        const formError = document.getElementById("contactFormError");
        const thankYouPanel = document.getElementById("contactThankYou");
        const thankYouMessage = document.getElementById("contactThankYouMessage");
        const sendAnotherButton = document.getElementById("sendAnotherMessage");
        const messageField = document.getElementById("contact-message");
        const characterCount = document.getElementById("contactMessageCount");
        const fields = Array.from(contactForm.querySelectorAll("input[required], textarea[required]"));

        const fieldMessages = {
            "contact-name": "Please enter your name.",
            "contact-email": "Enter a valid email address.",
            "contact-subject": "Please add a subject.",
            "contact-message": "Please write a short message.",
        };

        function validateField(field) {
            let message = "";
            if (field.validity.valueMissing) {
                message = fieldMessages[field.id] || "Please complete this field.";
            } else if (field.validity.typeMismatch) {
                message = fieldMessages[field.id] || "Check this value and try again.";
            } else if (field.validity.tooLong) {
                message = `Please use no more than ${field.maxLength} characters.`;
            }

            const fieldErrorIds = {
                "contact-name": "contactNameError",
                "contact-email": "contactEmailError",
                "contact-subject": "contactSubjectError",
                "contact-message": "contactMessageError",
            };
            const fieldError = document.getElementById(fieldErrorIds[field.id]);
            if (fieldError) {
                fieldError.textContent = message;
                fieldError.hidden = !message;
            }
            field.setAttribute("aria-invalid", String(Boolean(message)));
            return !message;
        }

        function updateMessageCount() {
            if (messageField && characterCount) {
                characterCount.textContent = `${messageField.value.length} / ${messageField.maxLength} characters`;
            }
        }

        function clearFormErrors() {
            formError && (formError.hidden = true);
            if (statusMessage) {
                statusMessage.textContent = "";
                statusMessage.classList.remove("is-error");
            }
            fields.forEach((field) => {
                field.setAttribute("aria-invalid", "false");
                const errorId = {
                    "contact-name": "contactNameError",
                    "contact-email": "contactEmailError",
                    "contact-subject": "contactSubjectError",
                    "contact-message": "contactMessageError",
                }[field.id];
                const errorElement = document.getElementById(errorId);
                if (errorElement) {
                    errorElement.textContent = "";
                    errorElement.hidden = true;
                }
            });
        }

        fields.forEach((field) => {
            field.addEventListener("blur", () => validateField(field));
            field.addEventListener("input", () => {
                if (field.getAttribute("aria-invalid") === "true") {
                    validateField(field);
                }
                formError && (formError.hidden = true);
            });
        });
        messageField?.addEventListener("input", updateMessageCount);
        updateMessageCount();

        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (isSubmitting) {
                return;
            }

            const invalidFields = fields.filter((field) => !validateField(field));
            if (invalidFields.length) {
                invalidFields[0].focus();
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
                    const errorText = result?.message || "Your message could not be processed. Please try again.";
                    if (formError) {
                        formError.textContent = errorText;
                        formError.hidden = false;
                    }
                    if (statusMessage) {
                        statusMessage.textContent = errorText;
                        statusMessage.classList.add("is-error");
                    }
                    return;
                }

                if (result.success) {
                    contactForm.reset();
                    updateMessageCount();
                    clearFormErrors();
                    if (thankYouMessage) {
                        thankYouMessage.textContent = result.message;
                    }
                    contactForm.hidden = true;
                    if (thankYouPanel) {
                        thankYouPanel.hidden = false;
                        thankYouPanel.focus();
                    }
                } else if (statusMessage) {
                    statusMessage.textContent = result.message;
                    statusMessage.classList.add("is-error");
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

        sendAnotherButton?.addEventListener("click", () => {
            thankYouPanel.hidden = true;
            contactForm.hidden = false;
            contactForm.reset();
            clearFormErrors();
            updateMessageCount();
            contactForm.querySelector("#contact-name")?.focus();
        });
    }
});
