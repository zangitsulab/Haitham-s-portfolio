const $ = (selector) => document.querySelector(selector);

let allArticles = [];


// ==========================
// ESCAPE HTML
// ==========================

function esc(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char])
    );
}


// ==========================
// DATE
// ==========================

function formatDate(date) {

    if (!date) return "";

    return new Date(date).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


// ==========================
// ARTICLES
// ==========================

async function loadArticles() {

    const grid = $("#articleGrid");

    if (!grid) return;

    const { data, error } = await supabaseClient
        .from("articles")
        .select("*")
        .eq("published", true)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Could not load articles:",
            error
        );

        grid.innerHTML = `
            <div class="empty-state">
                <strong>Could not load articles.</strong>
                <span>Please try again later.</span>
            </div>
        `;

        return;
    }

    allArticles = data || [];

    renderArticles(allArticles);
}


function renderArticles(articles) {

    const grid = $("#articleGrid");
    const count = $("#articleCount");

    if (!grid) return;

    let list = [...articles];

    const sort =
        $("#sort")?.value || "newest";

    if (sort === "title") {

        list.sort((a, b) =>
            (a.title || "").localeCompare(
                b.title || ""
            )
        );
    }

    if (sort === "featured") {

        list.sort(
            (a, b) =>
                Number(b.featured) -
                Number(a.featured)
        );
    }

    if (sort === "newest") {

        list.sort(
            (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
        );
    }

    if (count) {

        count.textContent =
            `${list.length} ${
                list.length === 1
                    ? "article"
                    : "articles"
            }`;
    }

    if (!list.length) {

        grid.innerHTML = `
            <div class="empty-state">
                <strong>No matching articles.</strong>
                <span>Try a different search term.</span>
            </div>
        `;

        return;
    }

    grid.innerHTML = list.map(article => {

        const image = article.image_url

            ? `
                <img
                    src="${esc(article.image_url)}"
                    alt="${esc(article.title)}"
                >
            `

            : `
                <div class="thumb-placeholder">
                    ✣
                </div>
            `;

        return `
            <article class="article">

                <a
                    class="article-link"
                    href="article.html?id=${encodeURIComponent(article.id)}"
                >

                    <div class="thumb">

                        ${image}

                        ${
                            article.featured
                                ? `<span class="badge">Featured</span>`
                                : ""
                        }

                    </div>

                    <div class="article-body">

                        <h3>
                            ${esc(article.title)}
                        </h3>

                        <p>
                            ${esc(
                                article.description || ""
                            )}
                        </p>

                        <div class="meta">

                            <span>
                                ${formatDate(
                                    article.created_at
                                )}
                            </span>

                            <span>
                                Read article →
                            </span>

                        </div>

                    </div>

                </a>

            </article>
        `;

    }).join("");
}


// ==========================
// ARTICLE SEARCH
// ==========================

function searchArticles(query) {

    const normalizedQuery =
        query.trim().toLowerCase();

    if (!normalizedQuery) {

        renderArticles(allArticles);

        return;
    }

    const results =
        allArticles.filter(article => {

            const title =
                (article.title || "")
                    .toLowerCase();

            const description =
                (article.description || "")
                    .toLowerCase();

            return (
                title.includes(normalizedQuery) ||
                description.includes(normalizedQuery)
            );
        });

    renderArticles(results);
}


function setupSearch() {

    const input =
        $("#heroSearch");

    const button =
        $("#heroSearchBtn");

    if (!input) return;

    input.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                searchArticles(
                    input.value
                );

                $("#articles")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    );

    if (button) {

        button.addEventListener(
            "click",
            () => {

                searchArticles(
                    input.value
                );

                $("#articles")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        );
    }

    input.addEventListener(
        "input",
        () => {

            searchArticles(
                input.value
            );
        }
    );
}


function setupSorting() {

    const sort = $("#sort");

    if (!sort) return;

    sort.addEventListener(
        "change",
        () => {

            const query =
                $("#heroSearch")
                    ?.value
                    .trim()
                    .toLowerCase() || "";

            if (!query) {

                renderArticles(
                    allArticles
                );

                return;
            }

            searchArticles(query);
        }
    );
}


// ==========================
// PROJECTS
// ==========================

async function loadProjects() {

    const grid =
        $("#projectGrid");

    if (!grid) return;

    const { data, error } =
        await supabaseClient
            .from("projects")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(
            "Could not load projects:",
            error
        );

        grid.innerHTML = `
            <div class="empty-state">
                <strong>Could not load projects.</strong>
                <span>Please try again later.</span>
            </div>
        `;

        return;
    }

    const projects = data || [];

    if (!projects.length) {

        grid.innerHTML = `
            <div class="empty-state">
                <strong>No projects yet.</strong>
                <span>
                    Projects and experiments will appear here as they are developed.
                </span>
            </div>
        `;

        return;
    }

    grid.innerHTML = projects.map(project => {

        const image =
            project.image_url

                ? `
                    <img
                        src="${esc(project.image_url)}"
                        alt="${esc(project.title)}"
                    >
                `

                : `
                    <div class="thumb-placeholder">
                        ✣
                    </div>
                `;

        return `
            <article class="article">

                <a
                    class="article-link"
                    href="project.html?id=${encodeURIComponent(project.id)}"
                >

                    <div class="thumb">

                        ${image}

                        ${
                            project.featured
                                ? `<span class="badge">Featured</span>`
                                : ""
                        }

                    </div>

                    <div class="article-body">

                        <h3>
                            ${esc(project.title)}
                        </h3>

                        <p>
                            ${esc(
                                project.description || ""
                            )}
                        </p>

                        <div class="meta">

                            <span>
                                ${formatDate(
                                    project.created_at
                                )}
                            </span>

                            <span>
                                View project →
                            </span>

                        </div>

                    </div>

                </a>

            </article>
        `;

    }).join("");
}


// ==========================
// START
// ==========================

setupSorting();
setupSearch();

loadArticles();
loadProjects();