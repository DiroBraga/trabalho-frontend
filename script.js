document.addEventListener("DOMContentLoaded", () => {
    // --- SELETORES DE LOGIN ---
    const loginContainer = document.getElementById("login-container");
    const loginForm = document.getElementById("login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginError = document.getElementById("login-error");

    // --- SELETORES DO APP ---
    const appContainer = document.getElementById("app-container");
    const logoutButton = document.getElementById("logout-button");

    // --- SELETORES DE NAVEGAÇÃO ---
    const navListBills = document.getElementById("nav-list-bills");
    const navAddBill = document.getElementById("nav-add-bill");
    const listBillsSection = document.getElementById("list-bills-section");
    const addBillSection = document.getElementById("add-bill-section");

    // --- SELETORES DE CONTAS (BILLS) ---
    const addBillForm = document.getElementById("add-bill-form");
    const billsTableBody = document.getElementById("bills-table-body");
    const billDescriptionInput = document.getElementById("bill-description");
    // Seletor de Fornecedor REMOVIDO
    const billAmountInput = document.getElementById("bill-amount");
    const billDueDateInput = document.getElementById("bill-due-date");
    const billInstallmentsInput = document.getElementById("bill-installments");
    const billInvoiceInput = document.getElementById("bill-invoice-number");
    const billTypeSelect = document.getElementById("bill-type");
    const billFrequencySelect = document.getElementById("bill-frequency");
    const billDiscountInput = document.getElementById("bill-discount");
    const billInterestInput = document.getElementById("bill-interest");
    const billPaymentMethodSelect = document.getElementById("bill-payment-method");
    const billPaymentDateInput = document.getElementById("bill-payment-date");

    // --- "BANCO DE DADOS" LOCALSTORAGE ---
    let bills = JSON.parse(localStorage.getItem("bills")) || [];
    // Base de Fornecedores REMOVIDA
    const today = new Date(); // Data de hoje para comparação de status

    // ==========================================
    // FUNÇÕES DE CONTAS (BILLS)
    // ==========================================

    function renderBillsTable() {
        billsTableBody.innerHTML = "";

        // Ordena as contas por data de vencimento
        const sortedBills = bills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (sortedBills.length === 0) {
            // Colspan ajustado para 7 (com coluna Ações)
            billsTableBody.innerHTML = '<tr><td colspan="7">Nenhuma conta lançada.</td></tr>';
            return;
        }

        sortedBills.forEach((bill) => {
            const row = document.createElement("tr");

            // 1. Formatar Valor
            const formattedAmount = parseFloat(bill.amount).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            });

            // 2. Formatar Data Vencimento
            const dueDate = new Date(bill.dueDate + "T12:00:00"); // Adiciona T12 para evitar bugs de fuso
            const formattedDueDate = dueDate.toLocaleDateString("pt-BR");

            // 3. Definir Status
            let statusHtml = "";
            if (bill.paymentDate) {
                statusHtml = '<span class="status status-pago">Pago</span>';
            } else if (dueDate < today) {
                statusHtml = '<span class="status status-atrasado">Atrasado</span>';
            } else {
                statusHtml = '<span class="status status-pendente">Pendente</span>';
            }

            // Coluna Fornecedor REMOVIDA
            row.innerHTML = `
                <td>${statusHtml}</td>
                <td>${bill.description}</td>
                <td>${formattedAmount}</td>
                <td>${formattedDueDate}</td>
                <td>${bill.invoiceNumber}</td>
                <td>${bill.type === "fixa" ? "Fixa" : "Variável"} / ${
                bill.frequency === "recorrente" ? "Recorrente" : "Pontual"
            }</td>
                <td><button class="delete-bill" data-id="${bill.id}">Remover</button></td>
            `;
            billsTableBody.appendChild(row);
        });
    }

    // Remover uma conta por id
    function deleteBillById(id) {
        const confirmDelete = confirm("Deseja remover esta conta?");
        if (!confirmDelete) return;
        bills = bills.filter((b) => b.id !== id);
        saveBillsToLocalStorage();
        renderBillsTable();
    }

    function saveBillsToLocalStorage() {
        localStorage.setItem("bills", JSON.stringify(bills));
    }

    /**
     * Lógica principal: Adicionar conta(s) com parcelamento
     */
    function handleAddBill(event) {
        event.preventDefault();

        // 1. Pegar valores base
        const description = billDescriptionInput.value;
        const totalAmount = parseFloat(billAmountInput.value);
        const firstDueDateStr = billDueDateInput.value;
        const firstDueDate = new Date(firstDueDateStr + "T12:00:00"); // Fuso
        const installments = parseInt(billInstallmentsInput.value) || 1;
        const discount = parseFloat(billDiscountInput.value) || 0;
        const interest = parseFloat(billInterestInput.value) || 0;

        // 2. Calcular valor da parcela
        const finalTotalAmount = totalAmount - discount + interest;
        const installmentAmount = (finalTotalAmount / installments).toFixed(2);

        // 3. Campos comuns (Fornecedor REMOVIDO)
        const commonData = {
            invoiceNumber: billInvoiceInput.value,
            type: billTypeSelect.value,
            frequency: billFrequencySelect.value,
            paymentMethod: billPaymentMethodSelect.value,
            paymentDate: billPaymentDateInput.value,
        };

        // 4. Loop para criar as parcelas
        for (let i = 0; i < installments; i++) {
            const installmentDueDate = new Date(firstDueDate);
            installmentDueDate.setMonth(firstDueDate.getMonth() + i);

            const newBill = {
                id: Date.now() + i, // ID único para cada parcela
                description: `${description} (${i + 1}/${installments})`,
                amount: installmentAmount,
                dueDate: installmentDueDate.toISOString().split("T")[0], // Formato AAAA-MM-DD
                ...commonData, // Adiciona os campos comuns
            };

            if (installments > 1) {
                newBill.paymentDate = null;
                newBill.paymentMethod = "";
            }

            bills.push(newBill);
        }

        // 5. Salvar, renderizar e limpar
        saveBillsToLocalStorage();
        renderBillsTable();
        addBillForm.reset();
        billInstallmentsInput.value = 1;
        billDiscountInput.value = 0;
        billInterestInput.value = 0;

        // 6. Mudar para a aba de listagem
        showListBillsSection();
    }

    // ==========================================
    // FUNÇÕES GERAIS (LOGIN E NAVEGAÇÃO)
    // ==========================================

    function showApp() {
        loginContainer.classList.add("hidden");
        appContainer.classList.remove("hidden");

        // Ao carregar o app:
        renderBillsTable(); // Desenha tabela de contas
        // Abrir a tela de cadastro por padrão após o login
        showAddBillSection(); // Define a tela inicial (cadastro)
    }

    function showLogin() {
        appContainer.classList.add("hidden");
        loginContainer.classList.remove("hidden");
        localStorage.removeItem("isLoggedIn");
    }

    /**
     * Login (permite qualquer usuário)
     */
    function handleLogin(event) {
        event.preventDefault();
        localStorage.setItem("isLoggedIn", "true");
        showApp();
        loginError.textContent = "";
        loginForm.reset();
    }

    function checkLoginStatus() {
        if (localStorage.getItem("isLoggedIn") === "true") {
            showApp();
        } else {
            showLogin();
        }
    }

    // Funções de troca de tela (Tabs)
    function showListBillsSection() {
        addBillSection.classList.add("hidden");
        listBillsSection.classList.remove("hidden");
        navAddBill.classList.remove("active");
        navListBills.classList.add("active");
    }

    function showAddBillSection() {
        listBillsSection.classList.add("hidden");
        addBillSection.classList.remove("hidden");
        navListBills.classList.remove("active");
        navAddBill.classList.add("active");
    }

    // --- EVENT LISTENERS ---
    loginForm.addEventListener("submit", handleLogin);
    logoutButton.addEventListener("click", showLogin);

    // Navegação atualizada
    navListBills.addEventListener("click", showListBillsSection);
    navAddBill.addEventListener("click", showAddBillSection);

    addBillForm.addEventListener("submit", handleAddBill);
    // Event listener de Fornecedor REMOVIDO

    // Delegação de evento para o botão Remover nas linhas da tabela
    billsTableBody.addEventListener("click", (e) => {
        const btn = e.target;
        if (btn && btn.classList.contains("delete-bill")) {
            const id = Number(btn.dataset.id);
            if (!Number.isNaN(id)) {
                deleteBillById(id);
            }
        }
    });

    // --- INICIALIZAÇÃO ---
    checkLoginStatus();
});
