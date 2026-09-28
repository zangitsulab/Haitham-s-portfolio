let editingArticleId = null;


// ==================================================
// IMAGE UPLOAD
// ==================================================

async function uploadImage(file, folder) {

    if (!file) {
        return "";
    }


    if (!file.type.startsWith("image/")) {

        throw new Error(
            "Please select an image file."
        );
    }


    const {
        data: userData,
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !userData.user) {

        throw new Error(
            "You are not logged in."
        );
    }


    const userId =
        userData.user.id;


    const safeName =
        file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
        );


    const filePath =
        `${userId}/${folder}/${Date.now()}-${safeName}`;


    const {
        error
    } = await supabaseClient.storage
        .from("portfolio-media")
        .upload(
            filePath,
            file,
            {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type
            }
        );


    if (error) {

        console.error(
            "Image upload error:",
            error
        );

        throw error;
    }


    const {
        data
    } = supabaseClient.storage
        .from("portfolio-media")
        .getPublicUrl(filePath);


    return data.publicUrl;
}


// ==================================================
// CHECK LOGIN
// ==================================================

async function checkUser() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();


    if (error || !data.user) {

        window.location.href =
            "admin.html";

        return;
    }


    console.log(
        "Logged in as:",
        data.user.email
    );
}


checkUser();


// ==================================================
// LOGOUT
// ==================================================

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        async () => {

            await supabaseClient.auth.signOut();

            window.location.href =
                "admin.html";
        }
    );


// ==================================================
// ARTICLES
// ==================================================

document
    .getElementById("articleForm")
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "message"
                );


            const submitButton =
                document.querySelector(
                    "#articleForm button[type='submit']"
                );


            message.textContent =
                editingArticleId
                    ? "Updating article..."
                    : "Creating article...";


            const {
                data: userData,
                error: userError
            } =
                await supabaseClient.auth.getUser();


            if (
                userError ||
                !userData.user
            ) {

                message.textContent =
                    "You are not logged in.";

                return;
            }


            try {

                const selectedFile =
                    document.getElementById(
                        "image_file"
                    ).files[0];


                let imageUrl =
                    editingArticleId
                        ? null
                        : "";


                if (selectedFile) {

                    message.textContent =
                        "Uploading image...";


                    imageUrl =
                        await uploadImage(
                            selectedFile,
                            "articles"
                        );
                }


                const articleData = {

                    title:
                        document.getElementById(
                            "title"
                        ).value,

                    description:
                        document.getElementById(
                            "description"
                        ).value,

                    content:
                        document.getElementById(
                            "content"
                        ).value,

                    publication_url:
                        document.getElementById(
                            "publication_url"
                        ).value,

                    published:
                        document.getElementById(
                            "published"
                        ).checked,

                    featured:
                        document.getElementById(
                            "featured"
                        ).checked
                };


                if (imageUrl !== null) {

                    articleData.image_url =
                        imageUrl;
                }


                let error;


                if (editingArticleId) {

                    const result =
                        await supabaseClient
                            .from("articles")
                            .update(articleData)
                            .eq(
                                "id",
                                editingArticleId
                            );

                    error =
                        result.error;

                } else {

                    const result =
                        await supabaseClient
                            .from("articles")
                            .insert({

                                ...articleData,

                                author_id:
                                    userData.user.id
                            });

                    error =
                        result.error;
                }


                if (error) {

                    throw error;
                }


                message.textContent =
                    editingArticleId
                        ? "Article updated successfully."
                        : "Article created successfully.";


                editingArticleId =
                    null;


                document
                    .getElementById(
                        "articleForm"
                    )
                    .reset();


                submitButton.textContent =
                    "Create Article";


                removeCancelButton();


                loadArticles();

            }

            catch (error) {

                console.error(
                    "Article save error:",
                    error
                );

                message.textContent =
                    "Error: " +
                    error.message;
            }
        }
    );


// ==================================================
// LOAD ARTICLES
// ==================================================

async function loadArticles() {

    const articlesList =
        document.getElementById(
            "articlesList"
        );


    const {
        data,
        error
    } = await supabaseClient
        .from("articles")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Error loading articles:",
            error
        );

        articlesList.textContent =
            "Error loading articles.";

        return;
    }


    if (!data.length) {

        articlesList.textContent =
            "No articles yet.";

        return;
    }


    articlesList.innerHTML = "";


    data.forEach(article => {

        const articleElement =
            document.createElement(
                "div"
            );


        articleElement.style.padding =
            "15px 0";


        articleElement.style.borderBottom =
            "1px solid #6FA7A5";


        articleElement.innerHTML = `

            <h3>${article.title}</h3>

            <p>
                ${article.description || ""}
            </p>

            <small>
                ${article.published ? "Published" : "Draft"}
                ${article.featured ? " • Featured" : ""}
                ${article.image_url ? " • Image uploaded" : ""}
                ${article.publication_url ? " • External publication linked" : ""}
            </small>

            <div style="margin-top: 12px;">

                <button onclick="editArticle(${article.id})">
                    Edit
                </button>

                <button
                    onclick="deleteArticle(${article.id})"
                    style="margin-left: 8px;"
                >
                    Delete
                </button>

            </div>
        `;


        articlesList.appendChild(
            articleElement
        );
    });
}


// ==================================================
// EDIT ARTICLE
// ==================================================

async function editArticle(id) {

    const {
        data,
        error
    } = await supabaseClient
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();


    if (error) {

        console.error(
            "Edit error:",
            error
        );

        alert(
            "Could not load the article."
        );

        return;
    }


    editingArticleId =
        id;


    document.getElementById(
        "title"
    ).value =
        data.title || "";


    document.getElementById(
        "description"
    ).value =
        data.description || "";


    document.getElementById(
        "content"
    ).value =
        data.content || "";


    document.getElementById(
        "publication_url"
    ).value =
        data.publication_url || "";


    document.getElementById(
        "published"
    ).checked =
        data.published;


    document.getElementById(
        "featured"
    ).checked =
        data.featured;


    const submitButton =
        document.querySelector(
            "#articleForm button[type='submit']"
        );


    submitButton.textContent =
        "Update Article";


    document.getElementById(
        "message"
    ).textContent =
        data.image_url
            ? "✏️ Editing article. Choose a new image only if you want to replace the current one."
            : "✏️ You are editing this article.";


    addCancelButton();


    document
        .getElementById(
            "articleForm"
        )
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


// ==================================================
// DELETE ARTICLE
// ==================================================

async function deleteArticle(id) {

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this article?"
        );


    if (!confirmed) return;


    const {
        error
    } = await supabaseClient
        .from("articles")
        .delete()
        .eq("id", id);


    if (error) {

        alert(
            "Could not delete the article.\n\n" +
            error.message
        );

        return;
    }


    alert(
        "Article deleted successfully."
    );


    loadArticles();
}


// ==================================================
// ARTICLE EDIT CONTROLS
// ==================================================

function addCancelButton() {

    if (
        document.getElementById(
            "cancelEditButton"
        )
    ) {
        return;
    }


    const submitButton =
        document.querySelector(
            "#articleForm button[type='submit']"
        );


    const cancelButton =
        document.createElement(
            "button"
        );


    cancelButton.type =
        "button";


    cancelButton.id =
        "cancelEditButton";


    cancelButton.textContent =
        "Cancel Edit";


    cancelButton.style.marginTop =
        "8px";


    cancelButton.addEventListener(
        "click",
        cancelEdit
    );


    submitButton.parentNode.insertBefore(
        cancelButton,
        submitButton.nextSibling
    );
}


function removeCancelButton() {

    const cancelButton =
        document.getElementById(
            "cancelEditButton"
        );


    if (cancelButton) {

        cancelButton.remove();
    }
}


function cancelEdit() {

    editingArticleId =
        null;


    document
        .getElementById(
            "articleForm"
        )
        .reset();


    document.getElementById(
        "message"
    ).textContent =
        "Edit cancelled.";


    const submitButton =
        document.querySelector(
            "#articleForm button[type='submit']"
        );


    submitButton.textContent =
        "Create Article";


    removeCancelButton();
}


// ==================================================
// PROJECTS
// ==================================================

document
    .getElementById("projectForm")
    .addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const form =
                document.getElementById(
                    "projectForm"
                );


            const message =
                document.getElementById(
                    "projectMessage"
                );


            const editingId =
                form.dataset.editingId;


            try {

                const selectedFile =
                    document.getElementById(
                        "projectImageFile"
                    ).files[0];


                let imageUrl =
                    editingId
                        ? null
                        : "";


                if (selectedFile) {

                    message.textContent =
                        "Uploading image...";


                    imageUrl =
                        await uploadImage(
                            selectedFile,
                            "projects"
                        );
                }


                const projectData = {

                    title:
                        document.getElementById(
                            "projectTitle"
                        ).value,

                    description:
                        document.getElementById(
                            "projectDescription"
                        ).value,

                    content:
                        document.getElementById(
                            "projectContent"
                        ).value,

                    project_url:
                        document.getElementById(
                            "projectUrl"
                        ).value,

                    featured:
                        document.getElementById(
                            "projectFeatured"
                        ).checked
                };


                if (imageUrl !== null) {

                    projectData.image_url =
                        imageUrl;
                }


                let error;


                if (editingId) {

                    const result =
                        await supabaseClient
                            .from("projects")
                            .update(projectData)
                            .eq(
                                "id",
                                editingId
                            );

                    error =
                        result.error;

                } else {

                    const {
                        data: userData,
                        error: userError
                    } =
                        await supabaseClient.auth.getUser();


                    if (
                        userError ||
                        !userData.user
                    ) {

                        throw new Error(
                            "You are not logged in."
                        );
                    }


                    const result =
                        await supabaseClient
                            .from("projects")
                            .insert({

                                ...projectData,

                                author_id:
                                    userData.user.id
                            });


                    error =
                        result.error;
                }


                if (error) {

                    throw error;
                }


                message.textContent =
                    editingId
                        ? "Project updated successfully."
                        : "Project created successfully.";


                form.reset();


                delete form.dataset.editingId;


                form.querySelector(
                    "button[type='submit']"
                ).textContent =
                    "Create Project";


                loadProjects();

            }

            catch (error) {

                console.error(
                    "Project save error:",
                    error
                );

                message.textContent =
                    "Error: " +
                    error.message;
            }
        }
    );


// ==================================================
// LOAD PROJECTS
// ==================================================

async function loadProjects() {

    const projectsList =
        document.getElementById(
            "projectsList"
        );


    const {
        data,
        error
    } = await supabaseClient
        .from("projects")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Error loading projects:",
            error
        );

        projectsList.textContent =
            "Error loading projects.";

        return;
    }


    if (!data.length) {

        projectsList.textContent =
            "No projects yet.";

        return;
    }


    projectsList.innerHTML = "";


    data.forEach(project => {

        const element =
            document.createElement(
                "div"
            );


        element.style.padding =
            "15px 0";


        element.style.borderBottom =
            "1px solid #6FA7A5";


        element.innerHTML = `

            <h3>${project.title}</h3>

            <p>
                ${project.description || ""}
            </p>

            <small>
                ${project.featured ? "Featured" : "Project"}
                ${project.image_url ? " • Image uploaded" : ""}
            </small>

            <div style="margin-top: 12px;">

                <button onclick="editProject(${project.id})">
                    Edit
                </button>

                <button
                    onclick="deleteProject(${project.id})"
                    style="margin-left: 8px;"
                >
                    Delete
                </button>

            </div>
        `;


        projectsList.appendChild(
            element
        );
    });
}


// ==================================================
// EDIT PROJECT
// ==================================================

async function editProject(id) {

    const {
        data,
        error
    } = await supabaseClient
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();


    if (error) {

        console.error(
            "Edit project error:",
            error
        );

        alert(
            "Could not load the project."
        );

        return;
    }


    document.getElementById(
        "projectTitle"
    ).value =
        data.title || "";


    document.getElementById(
        "projectDescription"
    ).value =
        data.description || "";


    document.getElementById(
        "projectContent"
    ).value =
        data.content || "";


    document.getElementById(
        "projectUrl"
    ).value =
        data.project_url || "";


    document.getElementById(
        "projectFeatured"
    ).checked =
        data.featured;


    const form =
        document.getElementById(
            "projectForm"
        );


    form.dataset.editingId =
        id;


    form.querySelector(
        "button[type='submit']"
    ).textContent =
        "Update Project";


    document.getElementById(
        "projectMessage"
    ).textContent =
        data.image_url
            ? "✏️ Editing project. Choose a new image only if you want to replace the current one."
            : "✏️ You are editing this project.";


    form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==================================================
// DELETE PROJECT
// ==================================================

async function deleteProject(id) {

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this project?"
        );


    if (!confirmed) return;


    const {
        error
    } =
        await supabaseClient
            .from("projects")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "Could not delete the project.\n\n" +
            error.message
        );

        return;
    }


    alert(
        "Project deleted successfully."
    );


    loadProjects();
}


// ==================================================
// INITIAL LOAD
// ==================================================

loadArticles();

loadProjects();