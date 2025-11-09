// DOM references
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

/* initial placeholder */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* app state */
const selectedProducts = [];
let productsCache = [];
const conversation = []; // conversation history
const STORAGE_KEY = "loreal_selected_product_ids";

/* load products.json (cached) */
async function loadProducts() {
  if (productsCache.length) return productsCache;
  const response = await fetch("products.json");
  const data = await response.json();
  productsCache = data.products;
  return productsCache;
}

/* render product cards (click to select) */
function displayProducts(products) {
  if (!products || products.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">No products found for that category.</div>
    `;
    return;
  }

  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <button class="info-btn" aria-expanded="false" aria-label="More info about ${product.name}">
          <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
        </button>
        <div style="display:flex;gap:8px;align-items:center;">
          <h3>${product.name}</h3>
        </div>
        <p>${product.brand}</p>
        <div class="description" hidden>
          ${product.description}
        </div>
      </div>
    </div>
  `
    )
    .join("");

  // attach card handlers
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.getAttribute("data-id"));
      toggleSelectProduct(id, card);
    });

    const infoBtn = card.querySelector(".info-btn");
    if (infoBtn) {
      infoBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        toggleExpand(card);
      });
    }
  });

  // mark already selected items
  products.forEach((p) => {
    const card = productsContainer.querySelector(
      `.product-card[data-id="${p.id}"]`
    );
    if (card && selectedProducts.find((s) => s.id === p.id)) {
      card.classList.add("selected");
      if (!card.querySelector(".badge")) {
        const b = document.createElement("div");
        b.className = "badge";
        b.textContent = "Selected";
        card.querySelector(".product-info").prepend(b);
      }
    }
  });
}

/* toggle description area */
function toggleExpand(cardEl) {
  const desc = cardEl.querySelector(".description");
  const btn = cardEl.querySelector(".info-btn");
  const isExpanded = cardEl.classList.toggle("expanded");
  if (desc) desc.hidden = !isExpanded;
  if (btn) btn.setAttribute("aria-expanded", String(isExpanded));
}

/* persist selected IDs */
function saveSelections() {
  try {
    const ids = selectedProducts.map((p) => p.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error("Failed saving selections:", err);
  }
}

/* clear all selections */
function clearSelections() {
  selectedProducts.splice(0, selectedProducts.length);
  productsContainer
    .querySelectorAll(".product-card.selected")
    .forEach((card) => {
      card.classList.remove("selected");
      const badge = card.querySelector(".badge");
      if (badge) badge.remove();
    });
  renderSelectedList();
  saveSelections();
}

/* restore saved selections (after products load) */
function loadSavedSelections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids) || ids.length === 0) return;
    const savedProducts = productsCache.filter((p) => ids.includes(p.id));
    if (savedProducts.length) {
      selectedProducts.splice(0, selectedProducts.length, ...savedProducts);
      renderSelectedList();
    }
  } catch (err) {
    console.error("Failed loading saved selections:", err);
  }
}

/* select / deselect product */
function toggleSelectProduct(productId, cardEl) {
  const product = productsCache.find((p) => p.id === productId);
  if (!product) return;

  const idx = selectedProducts.findIndex((p) => p.id === productId);
  if (idx === -1) {
    selectedProducts.push(product);
    cardEl.classList.add("selected");
    const b = document.createElement("div");
    b.className = "badge";
    b.textContent = "Selected";
    cardEl.querySelector(".product-info").prepend(b);
  } else {
    selectedProducts.splice(idx, 1);
    cardEl.classList.remove("selected");
    const b = cardEl.querySelector(".badge");
    if (b) b.remove();
  }

  renderSelectedList();
  saveSelections();
}

/* render selected items as chips with remove buttons */
function renderSelectedList() {
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (p) => `
    <div class="selected-chip" data-id="${p.id}">
      ${p.brand} • ${p.name}
      <button aria-label="Remove ${p.name}" data-id="${p.id}">&times;</button>
    </div>
  `
    )
    .join("");

  selectedProductsList.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.currentTarget.getAttribute("data-id"));
      const card = productsContainer.querySelector(
        `.product-card[data-id="${id}"]`
      );
      if (card) {
        card.classList.remove("selected");
        const badge = card.querySelector(".badge");
        if (badge) badge.remove();
      }
      const idx = selectedProducts.findIndex((s) => s.id === id);
      if (idx !== -1) selectedProducts.splice(idx, 1);
      renderSelectedList();
      saveSelections();
    });
  });
}

/* filter products by category */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );
  displayProducts(filteredProducts);
});

/* append message to chat window */
function appendChat(role, text) {
  const wrapper = document.createElement("div");
  wrapper.style.marginBottom = "12px";
  wrapper.innerHTML =
    role === "user"
      ? `<div style="font-weight:700;color:#222">You</div><div>${text}</div>`
      : `<div style="font-weight:700;color:var(--loreal-red)">Advisor</div><div>${text}</div>`;
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* build messages with conversation history */
function buildMessages(userText, includeSelected = true) {
  const system = {
    role: "system",
    content:
      "You are a L'Oréal product & routine advisor. Provide concise, practical routines and explanations.",
  };

  const selectedText =
    includeSelected && selectedProducts.length
      ? `Selected products:\n${selectedProducts
          .map((p) => `• ${p.brand} — ${p.name}: ${p.description}`)
          .join("\n")}\n`
      : "";

  const user = {
    role: "user",
    content: `${selectedText}\nUser request: ${userText}`,
  };

  const messages = [system, ...conversation, user];
  return messages;
}

/* minimal product serializer for AI payload */
function serializeSelectedProducts() {
  return selectedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description,
  }));
}

/* messages for routine generation (includes JSON of selected products) */
function buildMessagesForRoutine(userPrompt) {
  const system = {
    role: "system",
    content:
      "You are a L'Oréal product & routine advisor. Provide clear AM/PM routines using the provided product data.",
  };

  const productsJson = JSON.stringify(serializeSelectedProducts(), null, 2);

  const user = {
    role: "user",
    content: `SelectedProductsJson:\n${productsJson}\n\nRequest: ${userPrompt}`,
  };

  return [system, user];
}

/* backend worker URL */
const WORKER_URL = "https://lorealbotworker.ams63tube.workers.dev/";

/* send messages to worker (which proxies to OpenAI) */
async function callOpenAI(messages) {
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    const aiText = data?.choices?.[0]?.message?.content || JSON.stringify(data);
    return aiText;
  } catch (err) {
    console.error(err);
    return "Sorry — something went wrong calling the AI service.";
  }
}

/* generate routine from selected products */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    appendChat(
      "advisor",
      "Please select at least one product to generate a routine."
    );
    return;
  }

  const prompt =
    "Create a concise, step-by-step routine using the selected products. Include AM/PM and one short tip.";
  const messages = buildMessagesForRoutine(prompt);
  const userMessage = messages[1];

  conversation.push(userMessage);
  appendChat("user", "Generate a routine using my selected products.");
  appendChat("advisor", "Generating your routine…");

  const aiResponse = await callOpenAI(messages);
  conversation.push({ role: "assistant", content: aiResponse });
  appendChat("assistant", aiResponse);
});

/* handle follow-up chat messages */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;
  appendChat("user", text);

  const messages = buildMessages(text, false);
  appendChat("advisor", "Thinking…");
  const aiResponse = await callOpenAI(messages);

  conversation.push({ role: "user", content: text });
  conversation.push({ role: "assistant", content: aiResponse });

  appendChat("assistant", aiResponse);
  input.value = "";
});

/* app init: load products and restore selections */
async function init() {
  await loadProducts();
  loadSavedSelections();

  const clearBtn = document.getElementById("clearSelections");
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearSelections();
    });
  }
}

init();
