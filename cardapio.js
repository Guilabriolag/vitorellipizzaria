// Cardápio: categorias, busca, meia-meia. O carrinho fica em carrinho.js.

const ROTULO = { pizza: "Pizza", broto: "Broto", calzone: "Calzone", bebidas: "Bebida" };
let cat = "pizza";
let meia = false;
let primeira = null; // 1ª metade escolhida no modo meia-meia
let busca = "";

const semAcento = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const itensDaCategoria = () => (cat === "bebidas" ? BEBIDAS : SABORES);
const precoDe = (s) => (cat === "bebidas" ? s.p : cat === "pizza" ? s.g : s.b);
const podeMeia = () => cat === "pizza" || cat === "broto";

function selecionarCategoria(c) {
  cat = c;
  meia = false;
  primeira = null;
  busca = "";
  $("busca").value = "";
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.cat === c));
  $("modo").hidden = !podeMeia();
  desenhar();
}

function selecionarModo(m) {
  meia = m === "meia";
  primeira = null;
  document.querySelectorAll("#modo button").forEach((b) => b.classList.toggle("active", b.dataset.modo === m));
  desenhar();
}

function desenhar() {
  const aviso = $("aviso-meia");
  aviso.hidden = !(meia && podeMeia());
  if (!aviso.hidden) {
    $("aviso-texto").textContent = primeira
      ? `1ª metade: ${primeira.n}. Agora escolha a 2ª metade.`
      : "Escolha a 1ª metade.";
  }

  const q = semAcento(busca);
  const html = itensDaCategoria()
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !q || semAcento(s.n + " " + s.d).includes(q))
    .map(({ s, i }) => `
      <article class="item${primeira === s ? " sel" : ""}">
        <div class="item-txt">
          <h3>${s.n}</h3>
          <p>${s.d}</p>
          <span class="preco">${dinheiro(precoDe(s))}</span>
        </div>
        <button class="btn-add" data-i="${i}" aria-label="Adicionar ${s.n}">+</button>
      </article>`)
    .join("");
  $("sabores").innerHTML = html || '<p class="nada">Nenhum sabor encontrado. Tente outro nome ou ingrediente.</p>';
}

function escolher(i) {
  const s = itensDaCategoria()[i];
  if (meia && podeMeia()) {
    if (!primeira) { primeira = s; desenhar(); return; }
    const a = primeira, b = s;
    Carrinho.add({
      id: `${cat}-meia-${a.n}-${b.n}`,
      nome: `${ROTULO[cat]} meia-meia: ${a.n} & ${b.n}`,
      preco: Math.max(precoDe(a), precoDe(b)),
    });
    primeira = null;
    desenhar();
  } else {
    Carrinho.add({ id: `${cat}-${s.n}`, nome: `${ROTULO[cat]}: ${s.n}`, preco: precoDe(s) });
  }
}

function iniciar() {
  document.querySelectorAll(".tab").forEach((b) => (b.onclick = () => selecionarCategoria(b.dataset.cat)));
  document.querySelectorAll("#modo button").forEach((b) => (b.onclick = () => selecionarModo(b.dataset.modo)));
  $("busca").oninput = (e) => { busca = e.target.value; desenhar(); };
  $("cancelar-meia").onclick = () => { primeira = null; selecionarModo("inteira"); };
  $("sabores").onclick = (e) => {
    const b = e.target.closest(".btn-add");
    if (b) escolher(Number(b.dataset.i));
  };

  // Faixa de ingredientes: duplica as imagens para o loop ficar contínuo
  const pista = document.querySelector(".faixa-pista");
  pista.innerHTML += pista.innerHTML;

  Carrinho.iniciar();
  selecionarCategoria("pizza");
}

iniciar();
