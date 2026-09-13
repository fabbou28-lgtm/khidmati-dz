// =====================================================
// KHIDMATI DZ 🇩🇿
// =====================================================


// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
    "https://xnxsaxjyjaehiiunhdwg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_EvGdNUj3tQSzDhOO1lwevQ_yJpdEv-3";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// =====================================================
// GLOBAL
// =====================================================

let currentUser = null;

let currentProfile = null;

let selectedRating = 5;

let currentConversationId = null;

let currentChatChannel = null;

let currentNotificationChannel = null;


// =====================================================
// HELPERS
// =====================================================

function normalizeWilaya(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, " ");
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function openModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {

        modal.classList.add("active");
    }
}


function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {

        modal.classList.remove("active");
    }
}


function showMessage(message) {

    alert(message);
}


function scrollToTop() {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });
}


function scrollToWorkers() {

    document
        .getElementById("workersSection")
        ?.scrollIntoView({

            behavior: "smooth"

        });
}


// =====================================================
// ACCOUNT
// =====================================================

async function loadCurrentUser() {

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error(error);

        return;
    }


    currentUser =
        data.session?.user || null;


    if (currentUser) {

        await loadCurrentProfile();

        await loadNotificationCount();

        subscribeToNotifications();

    } else {

        currentProfile = null;

        updateAccountButton();

        document
            .getElementById("workerDashboard")
            ?.classList.add("hidden");

        document
            .getElementById("customerRequestsSection")
            ?.classList.add("hidden");

        updateNotificationBadge(0);

        if (currentNotificationChannel) {

            await supabaseClient
                .removeChannel(
                    currentNotificationChannel
                );

            currentNotificationChannel = null;
        }

        await loadWorkers();
    }
}


async function loadCurrentProfile() {

    if (!currentUser) return;


    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();


    if (error) {

        console.error(error);

        return;
    }


    currentProfile = data;


    updateAccountButton();


    if (!currentProfile) return;


    if (
        currentProfile.role ===
        "worker"
    ) {

        document
            .getElementById("workerDashboard")
            ?.classList.remove("hidden");

        document
            .getElementById("customerRequestsSection")
            ?.classList.add("hidden");

        await loadWorkerDashboard();

    } else {

        document
            .getElementById("customerRequestsSection")
            ?.classList.remove("hidden");

        document
            .getElementById("workerDashboard")
            ?.classList.add("hidden");

        await loadCustomerRequests();
    }


    await loadWorkers();
}


function updateAccountButton() {

    const button =
        document.getElementById(
            "accountButton"
        );


    if (!button) return;


    if (currentProfile) {

        button.textContent =
            `👤 ${currentProfile.name}`;

    } else {

        button.textContent =
            "👤 حسابي";
    }
}


function openAccountModal() {

    const content =
        document.getElementById(
            "accountContent"
        );


    if (!content) return;


    if (
        !currentUser ||
        !currentProfile
    ) {

        content.innerHTML = `

            <p class="empty-message">
                قم بإنشاء حساب أو تسجيل الدخول للاستمرار.
            </p>

            <br>

            <button
                class="primary-btn full-width"
                onclick="switchToRegister()">

                📝 إنشاء حساب

            </button>

            <br><br>

            <button
                class="secondary-btn full-width"
                onclick="switchToLogin()">

                🔐 تسجيل الدخول

            </button>

        `;

    } else {

        content.innerHTML = `

            <div class="worker-mini-profile">

                <h3>
                    👤 ${escapeHTML(
                        currentProfile.name
                    )}
                </h3>

                <p>
                    ${
                        currentProfile.role ===
                        "worker"
                            ? "👨‍🔧 حرفي"
                            : "👤 زبون"
                    }
                </p>

                <p>
                    📞 ${escapeHTML(
                        currentProfile.phone || ""
                    )}
                </p>

                ${
                    currentProfile.wilaya
                        ? `
                        <p>
                            🏙️ ${escapeHTML(
                                currentProfile.wilaya
                            )}
                        </p>
                        `
                        : ""
                }

                ${
                    currentProfile.speciality
                        ? `
                        <p>
                            🔧 ${escapeHTML(
                                currentProfile.speciality
                            )}
                        </p>
                        `
                        : ""
                }

            </div>

            <button
                class="primary-btn full-width"
                onclick="logout()">

                🚪 تسجيل الخروج

            </button>

        `;
    }


    openModal("accountModal");
}


// =====================================================
// REGISTER
// =====================================================

document
    .getElementById("registerRole")
    ?.addEventListener(
        "change",
        function () {

            const fields =
                document.getElementById(
                    "workerRegisterFields"
                );


            if (!fields) return;


            if (
                this.value ===
                "worker"
            ) {

                fields.classList.remove(
                    "hidden"
                );

            } else {

                fields.classList.add(
                    "hidden"
                );
            }
        }
    );


document
    .getElementById("registerForm")
    ?.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document
                    .getElementById(
                        "registerName"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "registerEmail"
                    )
                    .value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "registerPhone"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "registerPassword"
                    )
                    .value;


            const role =
                document
                    .getElementById(
                        "registerRole"
                    )
                    .value;


            const speciality =
                document
                    .getElementById(
                        "registerSpeciality"
                    )
                    .value;


            const wilaya =
                document
                    .getElementById(
                        "registerWilaya"
                    )
                    .value
                    .trim();


            if (
                role === "worker"
            ) {

                if (!speciality) {

                    showMessage(
                        "اختر تخصصك أولًا."
                    );

                    return;
                }


                if (!wilaya) {

                    showMessage(
                        "اكتب ولايتك."
                    );

                    return;
                }
            }


            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signUp({

                        email,

                        password,

                        options: {

                            data: {

                                name,

                                phone,

                                role,

                                speciality:
                                    role ===
                                    "worker"
                                        ? speciality
                                        : null,

                                wilaya:
                                    role ===
                                    "worker"
                                        ? wilaya
                                        : null
                            }
                        }
                    });


            if (error) {

                console.error(error);

                showMessage(
                    "حدث خطأ أثناء إنشاء الحساب:\n" +
                    error.message
                );

                return;
            }


            closeModal(
                "registerModal"
            );


            if (data.session) {

                showMessage(
                    "تم إنشاء الحساب بنجاح 🎉"
                );

                await loadCurrentUser();

            } else {

                showMessage(
                    "تم إنشاء الحساب بنجاح ✅\n\n" +
                    "إذا كان تأكيد البريد الإلكتروني مفعّلًا في Supabase، " +
                    "افتح بريدك ثم سجّل الدخول."
                );
            }

        }
    );


// =====================================================
// LOGIN
// =====================================================

document
    .getElementById("loginForm")
    ?.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;


            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInWithPassword({

                        email,

                        password

                    });


            if (error) {

                console.error(error);

                showMessage(
                    "فشل تسجيل الدخول:\n" +
                    error.message
                );

                return;
            }


            closeModal(
                "loginModal"
            );


            showMessage(
                "تم تسجيل الدخول بنجاح 🎉"
            );


            await loadCurrentUser();
        }
    );


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    await closeChat();


    if (currentNotificationChannel) {

        await supabaseClient
            .removeChannel(
                currentNotificationChannel
            );

        currentNotificationChannel = null;
    }


    const {
        error
    } =
        await supabaseClient
            .auth
            .signOut();


    if (error) {

        showMessage(
            error.message
        );

        return;
    }


    currentUser = null;

    currentProfile = null;


    closeModal(
        "accountModal"
    );


    updateAccountButton();

    updateNotificationBadge(0);


    document
        .getElementById(
            "workerDashboard"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "customerRequestsSection"
        )
        ?.classList.add(
            "hidden"
        );


    await loadWorkers();


    showMessage(
        "تم تسجيل الخروج."
    );
}


// =====================================================
// AUTH SWITCH
// =====================================================

function switchToRegister() {

    closeModal(
        "accountModal"
    );

    closeModal(
        "loginModal"
    );

    openModal(
        "registerModal"
    );
}


function switchToLogin() {

    closeModal(
        "accountModal"
    );

    closeModal(
        "registerModal"
    );

    openModal(
        "loginModal"
    );
}


// =====================================================
// REQUEST
// =====================================================

function openRequestModal() {

    if (!currentUser) {

        showMessage(
            "يجب تسجيل الدخول أولًا حتى تستطيع نشر طلب."
        );

        openAccountModal();

        return;
    }


    openModal(
        "requestModal"
    );
}


function selectServiceAndOpenRequest(
    service
) {

    if (!currentUser) {

        showMessage(
            "سجّل الدخول أولًا حتى تستطيع طلب الخدمة."
        );

        openAccountModal();

        return;
    }


    const serviceInput =
        document.getElementById(
            "requestService"
        );


    if (serviceInput) {

        serviceInput.value =
            service;
    }


    openModal(
        "requestModal"
    );
}


document
    .getElementById("requestForm")
    ?.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUser) {

                showMessage(
                    "يجب تسجيل الدخول."
                );

                return;
            }


            const service =
                document
                    .getElementById(
                        "requestService"
                    )
                    .value;


            const description =
                document
                    .getElementById(
                        "requestDescription"
                    )
                    .value
                    .trim();


            const budget =
                document
                    .getElementById(
                        "requestBudget"
                    )
                    .value;


            const wilaya =
                document
                    .getElementById(
                        "requestWilaya"
                    )
                    .value
                    .trim();


            const location =
                document
                    .getElementById(
                        "requestLocation"
                    )
                    .value
                    .trim();


            if (
                !service ||
                !description ||
                !wilaya ||
                !location
            ) {

                showMessage(
                    "املأ جميع المعلومات المطلوبة."
                );

                return;
            }


            const {
                error
            } =
                await supabaseClient
                    .from("requests")
                    .insert({

                        customer_id:
                            currentUser.id,

                        service,

                        description,

                        budget:
                            budget
                                ? Number(
                                    budget
                                )
                                : null,

                        wilaya,

                        location,

                        status:
                            "جديد"
                    });


            if (error) {

                console.error(error);

                showMessage(
                    "حدث خطأ أثناء نشر الطلب:\n" +
                    error.message
                );

                return;
            }


            closeModal(
                "requestModal"
            );


            document
                .getElementById(
                    "requestForm"
                )
                .reset();


            showMessage(
                "تم نشر طلبك بنجاح 🎉\n" +
                "سيظهر للحرفيين المناسبين في ولايتك."
            );


            if (
                currentProfile?.role ===
                "customer"
            ) {

                await loadCustomerRequests();
            }
        }
    );


// =====================================================
// CUSTOMER REQUESTS
// =====================================================

async function loadCustomerRequests() {

    if (!currentUser) return;


    const container =
        document.getElementById(
            "customerRequests"
        );


    if (!container) return;


    const {
        data: requests,
        error
    } =
        await supabaseClient
            .from("requests")
            .select("*")
            .eq(
                "customer_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        container.innerHTML = `

            <div class="empty-message">
                تعذر تحميل الطلبات.
            </div>

        `;

        return;
    }


    if (
        !requests ||
        requests.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-message">
                لم تنشر أي طلب بعد.
            </div>

        `;

        return;
    }


    container.innerHTML = "";


    for (
        const request of requests
    ) {

        const {
            data: offers,
            error: offersError
        } =
            await supabaseClient
                .from("offers")
                .select("*")
                .eq(
                    "request_id",
                    request.id
                )
                .order(
                    "price",
                    {
                        ascending: true
                    }
                );


        if (offersError) {

            console.error(
                offersError
            );
        }


        let offersHTML = "";


        if (
            offers &&
            offers.length > 0
        ) {

            for (
                const offer of offers
            ) {

                const {
                    data: worker
                } =
                    await supabaseClient
                        .from("profiles")
                        .select(
                            "id,name,phone,speciality,wilaya"
                        )
                        .eq(
                            "id",
                            offer.worker_id
                        )
                        .maybeSingle();


                if (!worker) continue;


                const {
                    average,
                    completed
                } =
                    await getWorkerStats(
                        worker.id
                    );


                offersHTML += `

                    <div class="offer-card">

                        <h3>
                            👨‍🔧
                            ${escapeHTML(
                                worker.name
                            )}
                        </h3>

                        <p class="worker-speciality">
                            ${escapeHTML(
                                worker.speciality || ""
                            )}
                        </p>

                        ${
                            worker.wilaya
                                ? `
                                <p>
                                    🏙️
                                    ${escapeHTML(
                                        worker.wilaya
                                    )}
                                </p>
                                `
                                : ""
                        }

                        <p>
                            ⭐
                            ${average.toFixed(1)}
                            ·
                            ✅
                            ${completed}
                            خدمة مكتملة
                        </p>

                        <p>
                            💰

                            <strong>
                                ${Number(
                                    offer.price
                                ).toLocaleString()}
                                DA
                            </strong>
                        </p>

                        ${
                            offer.message
                                ? `
                                <p>
                                    ${escapeHTML(
                                        offer.message
                                    )}
                                </p>
                                `
                                : ""
                        }


                        <div class="worker-actions">

                            <button
                                class="small-btn"
                                onclick="openWorkerProfile(
                                    '${worker.id}'
                                )">

                                👤 الملف

                            </button>


                            <button
                                class="chat-button"
                                onclick="openChatForRequest(
                                    ${request.id},
                                    '${worker.id}',
                                    '${escapeHTML(
                                        worker.name
                                    )}'
                                )">

                                💬 مراسلة

                            </button>


                            ${
                                request.status !==
                                "مكتمل"
                                    ? `

                                    <button
                                        class="primary-btn"
                                        onclick="completeRequest(
                                            ${request.id},
                                            '${worker.id}'
                                        )">

                                        ✅ اختيار وإنهاء

                                    </button>

                                    `
                                    : ""
                            }

                        </div>

                    </div>

                `;
            }

        } else {

            offersHTML = `

                <div class="empty-message">
                    لم تصل عروض بعد.
                </div>

            `;
        }


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "request-card";


        card.innerHTML = `

            <h3>
                🔧
                ${escapeHTML(
                    request.service
                )}
            </h3>

            <p>
                ${escapeHTML(
                    request.description
                )}
            </p>


            <div class="request-meta">

                <span class="meta-item">

                    🏙️
                    ${escapeHTML(
                        request.wilaya ||
                        "غير محددة"
                    )}

                </span>


                <span class="meta-item">

                    📍
                    ${escapeHTML(
                        request.location
                    )}

                </span>


                <span class="meta-item">

                    📌
                    ${escapeHTML(
                        request.status
                    )}

                </span>


                ${
                    request.budget
                        ? `

                        <span class="meta-item">

                            💰
                            ${Number(
                                request.budget
                            ).toLocaleString()}
                            DA

                        </span>

                        `
                        : ""
                }

            </div>


            <h4
                style="margin:20px 0 10px;">

                💰 العروض

            </h4>


            ${offersHTML}

        `;


        container.appendChild(
            card
        );
    }
}


// =====================================================
// WORKER DASHBOARD
// =====================================================

async function loadWorkerDashboard() {

    if (
        !currentUser ||
        !currentProfile ||
        currentProfile.role !==
            "worker"
    ) {

        return;
    }


    const profileContainer =
        document.getElementById(
            "workerMiniProfile"
        );


    const requestsContainer =
        document.getElementById(
            "workerRequests"
        );


    const {
        average,
        completed
    } =
        await getWorkerStats(
            currentUser.id
        );


    if (profileContainer) {

        profileContainer.innerHTML = `

            <h3>
                👨‍🔧
                ${escapeHTML(
                    currentProfile.name
                )}
            </h3>

            <p>
                🔧 التخصص:

                <strong>
                    ${escapeHTML(
                        currentProfile.speciality ||
                        "غير محدد"
                    )}
                </strong>
            </p>

            <p>
                🏙️ الولاية:

                <strong>
                    ${escapeHTML(
                        currentProfile.wilaya ||
                        "غير محددة"
                    )}
                </strong>
            </p>

            <p>
                ⭐ التقييم:

                <strong>
                    ${average.toFixed(1)} / 5
                </strong>
            </p>

            <p>
                ✅ الخدمات المكتملة:

                <strong>
                    ${completed}
                </strong>
            </p>

        `;
    }


    let query =
        supabaseClient
            .from("requests")
            .select("*")
            .eq(
                "service",
                currentProfile.speciality
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (currentProfile.wilaya) {

        query =
            query.eq(
                "wilaya",
                currentProfile.wilaya
            );
    }


    const {
        data: requests,
        error
    } = await query;


    if (error) {

        console.error(error);

        requestsContainer.innerHTML = `

            <div class="empty-message">
                تعذر تحميل الطلبات.
            </div>

        `;

        return;
    }


    if (
        !requests ||
        requests.length === 0
    ) {

        requestsContainer.innerHTML = `

            <div class="empty-message">
                لا توجد طلبات مناسبة لتخصصك وولايتك حاليًا.
            </div>

        `;

        return;
    }


    requestsContainer.innerHTML = "";


    for (
        const request of requests
    ) {

        const {
            data: customer
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id,name,phone"
                )
                .eq(
                    "id",
                    request.customer_id
                )
                .maybeSingle();


        const {
            data: myOffer
        } =
            await supabaseClient
                .from("offers")
                .select("id")
                .eq(
                    "request_id",
                    request.id
                )
                .eq(
                    "worker_id",
                    currentUser.id
                )
                .maybeSingle();


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "request-card";


        card.innerHTML = `

            <h3>
                🔧
                ${escapeHTML(
                    request.service
                )}
            </h3>

            <p>
                ${escapeHTML(
                    request.description
                )}
            </p>


            <div class="request-meta">

                <span class="meta-item">

                    🏙️
                    ${escapeHTML(
                        request.wilaya ||
                        "غير محددة"
                    )}

                </span>


                <span class="meta-item">

                    📍
                    ${escapeHTML(
                        request.location
                    )}

                </span>


                ${
                    request.budget
                        ? `

                        <span class="meta-item">

                            💰
                            ${Number(
                                request.budget
                            ).toLocaleString()}
                            DA

                        </span>

                        `
                        : ""
                }


                <span class="meta-item">

                    📌
                    ${escapeHTML(
                        request.status
                    )}

                </span>

            </div>


            ${
                customer
                    ? `

                    <p>
                        👤 الزبون:
                        ${escapeHTML(
                            customer.name
                        )}
                    </p>

                    <p>
                        📞
                        ${escapeHTML(
                            customer.phone
                        )}
                    </p>

                    `
                    : ""
            }


            <div class="worker-actions">

                ${
                    myOffer
                        ? `

                        <button
                            class="chat-button"
                            onclick="openChatForRequest(
                                ${request.id},
                                '${request.customer_id}',
                                '${customer
                                    ? escapeHTML(
                                        customer.name
                                    )
                                    : "الزبون"}'
                            )">

                            💬 مراسلة الزبون

                        </button>

                        `
                        : ""
                }


                ${
                    !myOffer
                        ? `

                        <button
                            class="primary-btn"
                            onclick="openOfferModal(
                                ${request.id}
                            )">

                            💰 تقديم عرض

                        </button>

                        `
                        : `

                        <button
                            class="secondary-btn"
                            onclick="showMessage(
                                'لقد قدمت عرضًا لهذا الطلب بالفعل.'
                            )">

                            ✅ تم تقديم العرض

                        </button>

                        `
                }

            </div>

        `;


        requestsContainer.appendChild(
            card
        );
    }
}


// =====================================================
// OFFERS
// =====================================================

function openOfferModal(
    requestId
) {

    if (
        !currentUser ||
        currentProfile?.role !==
            "worker"
    ) {

        showMessage(
            "هذه الخاصية للحرفيين فقط."
        );

        return;
    }


    document
        .getElementById(
            "offerRequestId"
        )
        .value = requestId;


    openModal(
        "offerModal"
    );
}


document
    .getElementById("offerForm")
    ?.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUser) return;


            const requestId =
                Number(
                    document
                        .getElementById(
                            "offerRequestId"
                        )
                        .value
                );


            const price =
                Number(
                    document
                        .getElementById(
                            "offerPrice"
                        )
                        .value
                );


            const message =
                document
                    .getElementById(
                        "offerMessage"
                    )
                    .value
                    .trim();


            if (
                !Number.isFinite(price) ||
                price < 0
            ) {

                showMessage(
                    "أدخل سعرًا صحيحًا."
                );

                return;
            }


            const {
                error
            } =
                await supabaseClient
                    .from("offers")
                    .insert({

                        request_id:
                            requestId,

                        worker_id:
                            currentUser.id,

                        price,

                        message
                    });


            if (error) {

                console.error(error);


                if (
                    error.code ===
                    "23505"
                ) {

                    showMessage(
                        "لقد قدمت عرضًا لهذا الطلب من قبل."
                    );

                } else {

                    showMessage(
                        "تعذر إرسال العرض:\n" +
                        error.message
                    );
                }


                return;
            }


            closeModal(
                "offerModal"
            );


            document
                .getElementById(
                    "offerForm"
                )
                .reset();


            showMessage(
                "تم إرسال عرضك بنجاح 💰"
            );


            await loadWorkerDashboard();
        }
    );


// =====================================================
// COMPLETE REQUEST
// =====================================================

async function completeRequest(
    requestId,
    workerId
) {

    if (!currentUser) return;


    const confirmed =
        confirm(
            "هل تريد اختيار هذا الحرفي وإنهاء الطلب؟"
        );


    if (!confirmed) return;


    const {
        error
    } =
        await supabaseClient
            .from("requests")
            .update({

                status: "مكتمل",

                selected_worker_id:
                    workerId

            })
            .eq(
                "id",
                requestId
            )
            .eq(
                "customer_id",
                currentUser.id
            );


    if (error) {

        console.error(error);

        showMessage(
            "تعذر إنهاء الطلب:\n" +
            error.message
        );

        return;
    }


    document
        .getElementById(
            "ratingRequestId"
        )
        .value =
        requestId;


    document
        .getElementById(
            "ratingWorkerId"
        )
        .value =
        workerId;


    selectedRating = 5;


    document
        .getElementById(
            "ratingStars"
        )
        .value =
        "5";


    setRating(5);


    openModal(
        "ratingModal"
    );


    await loadCustomerRequests();
}


// =====================================================
// RATING
// =====================================================

function setRating(
    stars
) {

    selectedRating =
        stars;


    const input =
        document.getElementById(
            "ratingStars"
        );


    if (input) {

        input.value =
            stars;
    }


    const buttons =
        document.querySelectorAll(
            ".stars-input button"
        );


    buttons.forEach(
        (
            button,
            index
        ) => {

            button.style.opacity =
                index < stars
                    ? "1"
                    : ".35";
        }
    );
}


document
    .getElementById("ratingForm")
    ?.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUser) return;


            const requestId =
                Number(
                    document
                        .getElementById(
                            "ratingRequestId"
                        )
                        .value
                );


            const workerId =
                document
                    .getElementById(
                        "ratingWorkerId"
                    )
                    .value;


            const stars =
                Number(
                    document
                        .getElementById(
                            "ratingStars"
                        )
                        .value
                );


            const comment =
                document
                    .getElementById(
                        "ratingComment"
                    )
                    .value
                    .trim();


            const {
                error
            } =
                await supabaseClient
                    .from("ratings")
                    .insert({

                        request_id:
                            requestId,

                        customer_id:
                            currentUser.id,

                        worker_id:
                            workerId,

                        stars,

                        comment

                    });


            if (error) {

                console.error(error);


                if (
                    error.code ===
                    "23505"
                ) {

                    showMessage(
                        "لقد قيّمت هذا الطلب من قبل."
                    );

                } else {

                    showMessage(
                        "تعذر إرسال التقييم:\n" +
                        error.message
                    );
                }


                return;
            }


            closeModal(
                "ratingModal"
            );


            document
                .getElementById(
                    "ratingForm"
                )
                .reset();


            setRating(5);


            showMessage(
                "شكرًا على تقييمك ⭐"
            );


            await loadCustomerRequests();

            await loadWorkers();
        }
    );


// =====================================================
// WORKER STATS
// =====================================================

async function getWorkerStats(
    workerId
) {

    let average = 0;

    let completed = 0;


    const {
        data: ratings,
        error: ratingsError
    } =
        await supabaseClient
            .from("ratings")
            .select("stars")
            .eq(
                "worker_id",
                workerId
            );


    if (
        !ratingsError &&
        ratings &&
        ratings.length > 0
    ) {

        const total =
            ratings.reduce(
                (
                    sum,
                    rating
                ) =>
                    sum +
                    Number(
                        rating.stars
                    ),
                0
            );


        average =
            total /
            ratings.length;
    }


    const {
        count,
        error: completedError
    } =
        await supabaseClient
            .from("requests")
            .select(
                "id",
                {
                    count:
                        "exact",
                    head:
                        true
                }
            )
            .eq(
                "selected_worker_id",
                workerId
            )
            .eq(
                "status",
                "مكتمل"
            );


    if (!completedError) {

        completed =
            count || 0;
    }


    return {
        average,
        completed
    };
}


// =====================================================
// PUBLIC WORKERS
// =====================================================

async function loadWorkers() {

    const container =
        document.getElementById(
            "workersList"
        );


    if (!container) return;


    const wilayaFilter =
        normalizeWilaya(
            document
                .getElementById(
                    "workerWilayaFilter"
                )
                ?.value
        );


    const specialityFilter =
        document
            .getElementById(
                "workerSpecialityFilter"
            )
            ?.value ||
        "";


    const {
        data: workers,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id,name,phone,role,speciality,wilaya,created_at"
            )
            .eq(
                "role",
                "worker"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        console.error(error);

        container.innerHTML = `

            <div class="empty-message">
                يجب تسجيل الدخول لعرض الحرفيين.
            </div>

        `;

        return;
    }


    let filteredWorkers =
        workers || [];


    if (wilayaFilter) {

        filteredWorkers =
            filteredWorkers.filter(
                worker => {

                    const workerWilaya =
                        normalizeWilaya(
                            worker.wilaya
                        );


                    return workerWilaya.includes(
                        wilayaFilter
                    );
                }
            );
    }


    if (specialityFilter) {

        filteredWorkers =
            filteredWorkers.filter(
                worker =>
                    worker.speciality ===
                    specialityFilter
            );
    }


    if (
        filteredWorkers.length ===
        0
    ) {

        container.innerHTML = `

            <div class="empty-message">
                لا يوجد حرفيون مطابقون للفلاتر الحالية.
            </div>

        `;

        return;
    }


    container.innerHTML = "";


    for (
        const worker of filteredWorkers
    ) {

        const {
            average,
            completed
        } =
            await getWorkerStats(
                worker.id
            );


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "worker-card";


        card.innerHTML = `

            <div class="worker-avatar">
                👨‍🔧
            </div>


            <h3>
                ${escapeHTML(
                    worker.name
                )}
            </h3>


            <div class="worker-speciality">

                🔧
                ${escapeHTML(
                    worker.speciality ||
                    "حرفي"
                )}

            </div>


            <div class="worker-location">

                🏙️
                ${escapeHTML(
                    worker.wilaya ||
                    "الولاية غير محددة"
                )}

            </div>


            <div class="worker-rating">

                ⭐
                ${average.toFixed(1)}

                ·

                ✅
                ${completed}
                خدمة

            </div>


            <div class="worker-actions">

                <button
                    class="primary-btn"
                    onclick="openWorkerProfile(
                        '${worker.id}'
                    )">

                    👤 الملف

                </button>

            </div>

        `;


        container.appendChild(
            card
        );
    }
}


// =====================================================
// FILTERS
// =====================================================

document
    .getElementById(
        "workerWilayaFilter"
    )
    ?.addEventListener(
        "input",
        loadWorkers
    );


document
    .getElementById(
        "workerSpecialityFilter"
    )
    ?.addEventListener(
        "change",
        loadWorkers
    );


function clearWorkerFilters() {

    const wilaya =
        document.getElementById(
            "workerWilayaFilter"
        );


    const speciality =
        document.getElementById(
            "workerSpecialityFilter"
        );


    if (wilaya) {

        wilaya.value = "";
    }


    if (speciality) {

        speciality.value = "";
    }


    loadWorkers();
}


// =====================================================
// WORKER PROFILE
// =====================================================

async function openWorkerProfile(
    workerId
) {

    const content =
        document.getElementById(
            "profileContent"
        );


    if (!content) return;


    const {
        data: worker,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id,name,phone,speciality,wilaya,role"
            )
            .eq(
                "id",
                workerId
            )
            .maybeSingle();


    if (
        error ||
        !worker
    ) {

        showMessage(
            "تعذر تحميل ملف الحرفي."
        );

        return;
    }


    const {
        average,
        completed
    } =
        await getWorkerStats(
            workerId
        );


    const {
        data: ratings
    } =
        await supabaseClient
            .from("ratings")
            .select(
                "stars,comment,created_at,customer_id"
            )
            .eq(
                "worker_id",
                workerId
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    let ratingsHTML = "";


    if (
        ratings &&
        ratings.length > 0
    ) {

        for (
            const rating of
            ratings.slice(0, 10)
        ) {

            const {
                data: customer
            } =
                await supabaseClient
                    .from("profiles")
                    .select("name")
                    .eq(
                        "id",
                        rating.customer_id
                    )
                    .maybeSingle();


            ratingsHTML += `

                <div class="offer-card">

                    <strong>

                        ${
                            customer
                                ? escapeHTML(
                                    customer.name
                                )
                                : "زبون"
                        }

                    </strong>


                    <div>

                        ⭐
                        ${rating.stars}/5

                    </div>


                    ${
                        rating.comment
                            ? `

                            <p>
                                ${escapeHTML(
                                    rating.comment
                                )}
                            </p>

                            `
                            : ""
                    }

                </div>

            `;
        }

    } else {

        ratingsHTML = `

            <div class="empty-message">
                لا توجد تقييمات بعد.
            </div>

        `;
    }


    content.innerHTML = `

        <div class="worker-avatar">
            👨‍🔧
        </div>


        <h2>
            ${escapeHTML(
                worker.name
            )}
        </h2>


        <p class="worker-speciality">

            🔧
            ${escapeHTML(
                worker.speciality ||
                "حرفي"
            )}

        </p>


        <p class="worker-location">

            🏙️
            ${escapeHTML(
                worker.wilaya ||
                "غير محددة"
            )}

        </p>


        <p>

            📞
            ${escapeHTML(
                worker.phone || ""
            )}

        </p>


        <div class="request-meta">

            <span class="meta-item">

                ⭐
                ${average.toFixed(1)}
                / 5

            </span>


            <span class="meta-item">

                ✅
                ${completed}
                خدمة مكتملة

            </span>

        </div>


        ${
            currentUser &&
            currentProfile &&
            currentProfile.role ===
                "customer"
                ? `

                <div
                    style="margin-top:15px;">

                    <button
                        class="chat-button"
                        onclick="showMessage(
                            'للمراسلة، افتح أحد عروض هذا الحرفي من طلباتك.'
                        )">

                        💬 مراسلة

                    </button>

                </div>

                `
                : ""
        }


        <h3
            style="margin:20px 0 10px;">

            ⭐ آراء الزبائن

        </h3>


        ${ratingsHTML}

    `;


    openModal(
        "profileModal"
    );
}


// =====================================================
// MY PROFILE
// =====================================================

async function openMyProfile() {

    if (!currentUser) return;


    await openWorkerProfile(
        currentUser.id
    );
}


// =====================================================
// SEARCH SERVICES
// =====================================================

document
    .getElementById(
        "searchInput"
    )
    ?.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(
                    ".service-card"
                )
                .forEach(
                    card => {

                        const service =
                            card.dataset
                                .service
                                .toLowerCase();


                        card.style.display =
                            service.includes(
                                search
                            )
                                ? ""
                                : "none";
                    }
                );
        }
    );


// =====================================================
// CHAT
// =====================================================

async function getOrCreateConversation(
    requestId,
    otherUserId
) {

    if (!currentUser) {

        showMessage(
            "يجب تسجيل الدخول أولًا."
        );

        return null;
    }


    const {
        data: request,
        error: requestError
    } =
        await supabaseClient
            .from("requests")
            .select(
                "id,customer_id"
            )
            .eq(
                "id",
                requestId
            )
            .maybeSingle();


    if (
        requestError ||
        !request
    ) {

        console.error(
            requestError
        );

        showMessage(
            "تعذر العثور على الطلب."
        );

        return null;
    }


    let customerId;

    let workerId;


    if (
        currentProfile?.role ===
        "customer"
    ) {

        customerId =
            currentUser.id;

        workerId =
            otherUserId;

    } else {

        customerId =
            request.customer_id;

        workerId =
            currentUser.id;
    }


    const {
        data: existing,
        error: existingError
    } =
        await supabaseClient
            .from("conversations")
            .select("*")
            .eq(
                "request_id",
                requestId
            )
            .eq(
                "worker_id",
                workerId
            )
            .maybeSingle();


    if (existingError) {

        console.error(
            existingError
        );

        showMessage(
            "تعذر تحميل المحادثة."
        );

        return null;
    }


    if (existing) {

        return existing;
    }


    const {
        data: conversation,
        error: insertError
    } =
        await supabaseClient
            .from("conversations")
            .insert({

                request_id:
                    requestId,

                customer_id:
                    customerId,

                worker_id:
                    workerId

            })
            .select("*")
            .single();


    if (insertError) {

        if (
            insertError.code ===
            "23505"
        ) {

            const {
                data:
                    retryConversation
            } =
                await supabaseClient
                    .from("conversations")
                    .select("*")
                    .eq(
                        "request_id",
                        requestId
                    )
                    .eq(
                        "worker_id",
                        workerId
                    )
                    .maybeSingle();


            return (
                retryConversation ||
                null
            );
        }


        console.error(
            insertError
        );


        showMessage(
            "تعذر إنشاء المحادثة:\n" +
            insertError.message
        );


        return null;
    }


    return conversation;
}


async function openChatForRequest(
    requestId,
    otherUserId,
    personName
) {

    if (!currentUser) {

        showMessage(
            "يجب تسجيل الدخول أولًا."
        );

        openAccountModal();

        return;
    }


    const conversation =
        await getOrCreateConversation(
            requestId,
            otherUserId
        );


    if (!conversation) return;


    currentConversationId =
        conversation.id;


    const personNameElement =
        document.getElementById(
            "chatPersonName"
        );


    if (personNameElement) {

        personNameElement.textContent =
            personName ||
            "المحادثة";
    }


    const messagesContainer =
        document.getElementById(
            "chatMessages"
        );


    if (messagesContainer) {

        messagesContainer.innerHTML = `

            <div class="chat-loading">
                جاري تحميل الرسائل...
            </div>

        `;
    }


    openModal(
        "chatModal"
    );


    await loadChatMessages(
        currentConversationId
    );


    subscribeToChat(
        currentConversationId
    );


    setTimeout(
        () => {

            document
                .getElementById(
                    "chatInput"
                )
                ?.focus();

        },
        100
    );
}


async function loadChatMessages(
    conversationId
) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) return;


    const {
        data: messages,
        error
    } =
        await supabaseClient
            .from("messages")
            .select(
                "id,sender_id,message,created_at"
            )
            .eq(
                "conversation_id",
                conversationId
            )
            .order(
                "created_at",
                {
                    ascending:
                        true
                }
            );


    if (error) {

        console.error(error);

        container.innerHTML = `

            <div class="chat-empty">
                تعذر تحميل الرسائل.
            </div>

        `;

        return;
    }


    if (
        !messages ||
        messages.length === 0
    ) {

        container.innerHTML = `

            <div class="chat-empty">
                لا توجد رسائل بعد 👋
            </div>

        `;

        return;
    }


    container.innerHTML = "";


    messages.forEach(
        message => {

            appendChatMessage(
                message
            );
        }
    );


    scrollChatToBottom();
}


function appendChatMessage(
    message
) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) return;


    const empty =
        container.querySelector(
            ".chat-empty"
        );


    if (empty) {

        empty.remove();
    }


    if (
        container.querySelector(
            `[data-message-id="${message.id}"]`
        )
    ) {

        return;
    }


    const isMine =
        message.sender_id ===
        currentUser?.id;


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        `chat-message ${
            isMine
                ? "mine"
                : "theirs"
        }`;


    messageElement.dataset.messageId =
        message.id;


    const date =
        new Date(
            message.created_at
        );


    const time =
        date.toLocaleTimeString(
            "ar-DZ",
            {

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        );


    messageElement.innerHTML = `

        <p class="chat-message-text">

            ${escapeHTML(
                message.message
            )}

        </p>


        <span class="chat-message-time">

            ${time}

        </span>

    `;


    container.appendChild(
        messageElement
    );


    scrollChatToBottom();
}


function scrollChatToBottom() {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) return;


    container.scrollTop =
        container.scrollHeight;
}


function subscribeToChat(
    conversationId
) {

    if (
        currentChatChannel
    ) {

        supabaseClient
            .removeChannel(
                currentChatChannel
            );

        currentChatChannel =
            null;
    }


    currentChatChannel =
        supabaseClient
            .channel(
                `chat-${conversationId}`
            )
            .on(
                "postgres_changes",
                {

                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "messages",

                    filter:
                        `conversation_id=eq.${conversationId}`

                },
                payload => {

                    if (
                        currentConversationId ===
                        conversationId
                    ) {

                        appendChatMessage(
                            payload.new
                        );
                    }
                }
            )
            .subscribe(
                status => {

                    console.log(
                        "Chat realtime:",
                        status
                    );
                }
            );
}


document
    .getElementById(
        "chatForm"
    )
    ?.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (
                !currentUser ||
                !currentConversationId
            ) {

                showMessage(
                    "لا توجد محادثة مفتوحة."
                );

                return;
            }


            const input =
                document.getElementById(
                    "chatInput"
                );


            const button =
                this.querySelector(
                    "button[type='submit']"
                );


            if (!input) return;


            const message =
                input.value.trim();


            if (!message) return;


            if (button) {

                button.disabled =
                    true;
            }


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("messages")
                    .insert({

                        conversation_id:
                            currentConversationId,

                        sender_id:
                            currentUser.id,

                        message

                    })
                    .select(
                        "id,sender_id,message,created_at"
                    )
                    .single();


            if (error) {

                console.error(error);

                showMessage(
                    "تعذر إرسال الرسالة:\n" +
                    error.message
                );

            } else {

                input.value = "";


                appendChatMessage(
                    data
                );
            }


            if (button) {

                button.disabled =
                    false;
            }


            input.focus();
        }
    );


async function closeChat() {

    currentConversationId =
        null;


    if (
        currentChatChannel
    ) {

        await supabaseClient
            .removeChannel(
                currentChatChannel
            );

        currentChatChannel =
            null;
    }


    closeModal(
        "chatModal"
    );


    const input =
        document.getElementById(
            "chatInput"
        );


    if (input) {

        input.value = "";
    }
}


// =====================================================
// NOTIFICATIONS
// =====================================================

function getNotificationIcon(
    type
) {

    switch (type) {

        case "offer":
            return "💰";

        case "selected":
            return "✅";

        case "rating":
            return "⭐";

        case "message":
            return "💬";

        case "request":
            return "📋";

        default:
            return "🔔";
    }
}


function formatNotificationTime(
    createdAt
) {

    if (!createdAt) return "";


    const date =
        new Date(
            createdAt
        );


    return date.toLocaleString(
        "ar-DZ",
        {

            day: "2-digit",

            month: "2-digit",

            year: "numeric",

            hour: "2-digit",

            minute: "2-digit"

        }
    );
}


function updateNotificationBadge(
    count
) {

    const badge =
        document.getElementById(
            "notificationBadge"
        );


    if (!badge) return;


    const safeCount =
        Number(count) || 0;


    if (safeCount <= 0) {

        badge.classList.add(
            "hidden"
        );

        badge.textContent =
            "0";

        return;
    }


    badge.classList.remove(
        "hidden"
    );


    badge.textContent =
        safeCount > 99
            ? "99+"
            : String(
                safeCount
            );
}


async function loadNotificationCount() {

    if (!currentUser) {

        updateNotificationBadge(0);

        return;
    }


    const {
        count,
        error
    } =
        await supabaseClient
            .from("notifications")
            .select(
                "id",
                {
                    count:
                        "exact",
                    head:
                        true
                }
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .eq(
                "is_read",
                false
            );


    if (error) {

        console.error(
            "Notification count error:",
            error
        );

        return;
    }


    updateNotificationBadge(
        count || 0
    );
}


async function loadNotifications() {

    const container =
        document.getElementById(
            "notificationsList"
        );


    if (!container) return;


    if (!currentUser) {

        container.innerHTML = `

            <div class="empty-message">
                سجّل الدخول لرؤية إشعاراتك.
            </div>

        `;

        updateNotificationBadge(0);

        return;
    }


    container.innerHTML = `

        <div class="chat-loading">
            جاري تحميل الإشعارات...
        </div>

    `;


    const {
        data: notifications,
        error
    } =
        await supabaseClient
            .from("notifications")
            .select(
                "id,title,message,type,related_request_id,is_read,created_at"
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            )
            .limit(50);


    if (error) {

        console.error(error);

        container.innerHTML = `

            <div class="empty-message">
                تعذر تحميل الإشعارات.
            </div>

        `;

        return;
    }


    if (
        !notifications ||
        notifications.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-message">
                لا توجد إشعارات حتى الآن 🔔
            </div>

        `;

        updateNotificationBadge(0);

        return;
    }


    container.innerHTML = "";


    notifications.forEach(
        notification => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                `notification-item ${
                    notification.is_read
                        ? ""
                        : "unread"
                }`;


            item.dataset.notificationId =
                notification.id;


            item.innerHTML = `

                <div class="notification-icon">

                    ${getNotificationIcon(
                        notification.type
                    )}

                </div>


                <div class="notification-body">

                    <strong>

                        ${escapeHTML(
                            notification.title
                        )}

                    </strong>


                    <p>

                        ${escapeHTML(
                            notification.message
                        )}

                    </p>


                    <span class="notification-time">

                        ${formatNotificationTime(
                            notification.created_at
                        )}

                    </span>

                </div>


                ${
                    !notification.is_read
                        ? `

                        <span class="notification-unread-dot">
                        </span>

                        `
                        : ""
                }

            `;


            item.addEventListener(
                "click",
                async () => {

                    await markNotificationRead(
                        notification.id
                    );


                    item.classList.remove(
                        "unread"
                    );


                    const dot =
                        item.querySelector(
                            ".notification-unread-dot"
                        );


                    if (dot) {

                        dot.remove();
                    }


                    if (
                        notification.related_request_id
                    ) {

                        closeModal(
                            "notificationsModal"
                        );


                        if (
                            currentProfile?.role ===
                            "customer"
                        ) {

                            const requestsSection =
                                document.getElementById(
                                    "customerRequestsSection"
                                );


                            requestsSection
                                ?.scrollIntoView({
                                    behavior:
                                        "smooth"
                                });

                        } else {

                            const dashboard =
                                document.getElementById(
                                    "workerDashboard"
                                );


                            dashboard
                                ?.scrollIntoView({
                                    behavior:
                                        "smooth"
                                });
                        }
                    }
                }
            );


            container.appendChild(
                item
            );
        }
    );


    await loadNotificationCount();
}


async function openNotifications() {

    if (!currentUser) {

        showMessage(
            "يجب تسجيل الدخول أولًا لرؤية الإشعارات."
        );

        openAccountModal();

        return;
    }


    openModal(
        "notificationsModal"
    );


    await loadNotifications();
}


async function markNotificationRead(
    notificationId
) {

    if (!currentUser) return;


    const {
        error
    } =
        await supabaseClient
            .from("notifications")
            .update({

                is_read:
                    true

            })
            .eq(
                "id",
                notificationId
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        console.error(
            "Mark notification error:",
            error
        );

        return;
    }


    await loadNotificationCount();
}


async function markAllNotificationsRead() {

    if (!currentUser) return;


    const {
        error
    } =
        await supabaseClient
            .from("notifications")
            .update({

                is_read:
                    true

            })
            .eq(
                "user_id",
                currentUser.id
            )
            .eq(
                "is_read",
                false
            );


    if (error) {

        console.error(error);

        showMessage(
            "تعذر تعليم الإشعارات كمقروءة."
        );

        return;
    }


    updateNotificationBadge(0);


    await loadNotifications();
}


function subscribeToNotifications() {

    if (!currentUser) return;


    if (
        currentNotificationChannel
    ) {

        supabaseClient
            .removeChannel(
                currentNotificationChannel
            );

        currentNotificationChannel =
            null;
    }


    currentNotificationChannel =
        supabaseClient
            .channel(
                `notifications-${currentUser.id}`
            )
            .on(
                "postgres_changes",
                {

                    event:
                        "INSERT",

                    schema:
                        "public",

                    table:
                        "notifications",

                    filter:
                        `user_id=eq.${currentUser.id}`

                },
                payload => {

                    console.log(
                        "New notification:",
                        payload.new
                    );


                    updateNotificationBadgeFromRealtime();


                    const title =
                        payload.new.title ||
                        "إشعار جديد";


                    const message =
                        payload.new.message ||
                        "";


                    showNotificationToast(
                        title,
                        message
                    );
                }
            )
            .subscribe(
                status => {

                    console.log(
                        "Notifications realtime:",
                        status
                    );
                }
            );
}


async function updateNotificationBadgeFromRealtime() {

    await loadNotificationCount();
}


function showNotificationToast(
    title,
    message
) {

    const oldToast =
        document.querySelector(
            ".notification-toast"
        );


    if (oldToast) {

        oldToast.remove();
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "notification-toast";


    toast.innerHTML = `

        <div class="notification-toast-icon">
            🔔
        </div>

        <div>

            <strong>
                ${escapeHTML(title)}
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;


    Object.assign(
        toast.style,
        {

            position:
                "fixed",

            top:
                "75px",

            right:
                "20px",

            zIndex:
                "5000",

            width:
                "min(360px, calc(100vw - 40px))",

            display:
                "flex",

            gap:
                "10px",

            alignItems:
                "flex-start",

            padding:
                "14px",

            borderRadius:
                "14px",

            background:
                "white",

            boxShadow:
                "0 8px 30px rgba(0,0,0,.18)",

            border:
                "1px solid #e5eeee",

            direction:
                "rtl"

        }
    );


    document.body.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        5000
    );
}


// =====================================================
// MODAL CLICK OUTSIDE
// =====================================================

document
    .querySelectorAll(".modal")
    .forEach(
        modal => {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        if (
                            modal.id ===
                            "chatModal"
                        ) {

                            closeChat();

                        } else {

                            modal.classList.remove(
                                "active"
                            );
                        }
                    }
                }
            );
        }
    );


// =====================================================
// AUTH STATE
// =====================================================

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        currentUser =
            session?.user ||
            null;


        await loadCurrentUser();
    }
);


// =====================================================
// START
// =====================================================

(async function init() {

    setRating(5);

    await loadCurrentUser();

})();