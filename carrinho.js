// Carrinho: itens, totais, entrega, pagamento e envio ao WhatsApp.
// Uso a partir do cardápio: Carrinho.add({ id, nome, preco })

const $ = (id) => document.getElementById(id);
const dinheiro = (v) => "R$ " + v.toFixed(2).replace(".", ",");

let _toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove("on"), 1800);
}

const Carrinho = (() => {
  let itens = [];
  let modo = null; // "retirar" | "delivery"

  try { itens = JSON.parse(localStorage.getItem("vitorelli-itens")) || []; } catch (e) {}
  const salvar = () => { try { localStorage.setItem("vitorelli-itens", JSON.stringify(itens)); } catch (e) {} };

  const qtd = () => itens.reduce((s, i) => s + i.qtd, 0);
  const subtotal = () => itens.reduce((s, i) => s + i.preco * i.qtd, 0);
  const taxa = () => {
    if (modo !== "delivery") return 0;
    const b = BAIRROS.find((x) => x.n === $("bairro").value);
    return b ? b.t : 0;
  };

  function add(item) {
    const achado = itens.find((i) => i.id === item.id);
    if (achado) achado.qtd++; else itens.push({ ...item, qtd: 1 });
    salvar();
    renderizar();
    toast(item.nome + " adicionado");
    const b = $("barra");
    b.classList.remove("pulo"); void b.offsetWidth; b.classList.add("pulo");
  }

  function mudar(k, d) {
    itens[k].qtd += d;
    if (itens[k].qtd <= 0) itens.splice(k, 1);
    salvar();
    renderizar();
  }

  function limpar() { itens = []; salvar(); renderizar(); }

  function abrir(v) {
    $("carrinho").classList.toggle("open", v);
    $("veu").classList.toggle("on", v);
    document.body.classList.toggle("travado", v);
  }

  function escolherModo(m) {
    modo = m;
    $("btn-retirar").classList.toggle("active", m === "retirar");
    $("btn-delivery").classList.toggle("active", m === "delivery");
    $("entregaCampos").hidden = m !== "delivery";
    renderizar();
  }

  function renderizar() {
    const n = qtd();
    $("cart-count").textContent = n;
    $("barra").hidden = n === 0;
    $("barra-total").textContent = dinheiro(subtotal());
    $("barra-itens").textContent = n + (n === 1 ? " item" : " itens");

    $("lista-pedido").innerHTML = n === 0
      ? '<li class="vazio">Seu pedido está vazio. Escolha um sabor para começar.</li>'
      : itens.map((it, k) => `
        <li>
          <span class="it-nome">${it.nome}</span>
          <span class="it-preco">${dinheiro(it.preco * it.qtd)}</span>
          <span class="qtd">
            <button data-k="${k}" data-d="-1" aria-label="Diminuir">−</button>
            <b>${it.qtd}</b>
            <button data-k="${k}" data-d="1" aria-label="Aumentar">+</button>
          </span>
        </li>`).join("");

    const t = taxa();
    $("resumo-sub").textContent = dinheiro(subtotal());
    $("linha-taxa").hidden = modo !== "delivery";
    $("resumo-taxa").textContent = dinheiro(t);
    $("resumo-total").textContent = dinheiro(subtotal() + t);
  }

  function enviar() {
    if (!itens.length) return toast("Adicione ao menos um item");
    if (!modo) return toast("Escolha retirar ou delivery");
    const rua = $("endereco").value.trim();
    const bairro = $("bairro").value;
    if (modo === "delivery" && (!rua || !bairro)) return toast("Informe rua, número e bairro");
    const pag = $("pagamento").value;
    if (!pag) return toast("Escolha a forma de pagamento");

    const linhas = itens.map((i) => `${i.qtd}x ${i.nome} - ${dinheiro(i.preco * i.qtd)}`).join("\n");
    const local = modo === "delivery" ? `Delivery: ${rua} - ${bairro}` : "Retirada no balcão";
    let msg = `*PEDIDO VITORELLI*\n\n${linhas}\n\nSubtotal: ${dinheiro(subtotal())}`;
    if (modo === "delivery") msg += `\nTaxa de entrega: ${dinheiro(taxa())}`;
    msg += `\n*Total: ${dinheiro(subtotal() + taxa())}*\n\n📍 ${local}\n💳 Pagamento: ${pag}`;
    const troco = $("valorTroco").value;
    if (pag === "Dinheiro" && troco) msg += `\n💵 Troco para: ${dinheiro(Number(troco))}`;

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function iniciar() {
    $("bairro").innerHTML = '<option value="">Bairro</option>' +
      BAIRROS.map((b) => `<option value="${b.n}">${b.n} · ${dinheiro(b.t)}</option>`).join("");

    $("barra").onclick = () => abrir(true);
    $("veu").onclick = () => abrir(false);
    $("btn-fechar").onclick = () => abrir(false);
    $("btn-limpar").onclick = limpar;
    $("btn-retirar").onclick = () => escolherModo("retirar");
    $("btn-delivery").onclick = () => escolherModo("delivery");
    $("bairro").onchange = renderizar;
    $("pagamento").onchange = (e) => { $("trocoArea").hidden = e.target.value !== "Dinheiro"; };
    $("enviar").onclick = enviar;
    $("lista-pedido").onclick = (e) => {
      const b = e.target.closest("button[data-k]");
      if (b) mudar(Number(b.dataset.k), Number(b.dataset.d));
    };
    renderizar();
  }

  return { add, iniciar };
})();
