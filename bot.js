import fs from 'fs';
import * as cheerio from 'cheerio';

const telefone = "5511953622481";
const apikey = "7271489"; // <-- COLOQUE SUA APIKEY NUMÉRICA AQUI
const siteUrl = "https://meusanimes.blog/";

// Verifica se a execução é para o Resumo Diário (recap)
const eModoRecap = process.argv.includes('--recap');

async function enviarWhatsApp(mensagem) {
  const urlCallMeBot = `https://api.callmebot.com/whatsapp.php?phone=${telefone}&text=${encodeURIComponent(mensagem)}&apikey=${apikey}`;
  const resposta = await fetch(urlCallMeBot);
  return resposta.ok;
}

async function capturarLancamentos() {
  const respostaSite = await fetch(siteUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!respostaSite.ok) return [];

  const html = await respostaSite.text();
  const $ = cheerio.load(html);
  const listaLancamentos = [];

  // Pega os itens recentes exibidos no site
  $('.episodes-list .item, .last-episodes .item, article, .item').each((i, el) => {
    const texto = $(el).text().trim().replace(/\s+/g, ' ');
    if (texto && !listaLancamentos.includes(texto)) {
      listaLancamentos.push(texto);
    }
  });

  if (listaLancamentos.length === 0) {
    $('a[href*="episodio"]').each((i, el) => {
      const titleAttr = $(el).attr('title');
      const textContent = $(el).text().trim();
      const item = (titleAttr ? titleAttr : textContent).replace(/\s+/g, ' ').trim();
      if (item && !listaLancamentos.includes(item)) {
        listaLancamentos.push(item);
      }
    });
  }

  return listaLancamentos;
}

async function executarBot() {
  try {
    if (eModoRecap) {
      console.log("Executando o Resumo Diário (Recap)...");
      
      let historicoDia = [];
      if (fs.existsSync("lancamentos_hoje.txt")) {
        historicoDia = fs.readFileSync("lancamentos_hoje.txt", "utf-8")
          .split("\n")
          .map(l => l.trim())
          .filter(l => l.length > 0);
      }

      if (historicoDia.length === 0) {
        console.log("Nenhum lançamento registrado hoje para o resumo.");
        return;
      }

      let mensagemRecap = `📊 *RECAP DO DIA - MEUS ANIMES*\n\nConfira todos os episódios lançados hoje:\n\n`;
      historicoDia.forEach((anime, index) => {
        mensagemRecap += `${index + 1}. 🍿 ${anime}\n`;
      });

      const enviado = await enviarWhatsApp(mensagemRecap);
      if (enviado) {
        console.log("Resumo diário enviado com sucesso!");
        // Limpa o histórico do dia para o dia seguinte
        fs.writeFileSync("lancamentos_hoje.txt", "");
      }
      return;
    }

    // --- MODO MONITORAMENTO NORMAL (30 MIN) ---
    console.log("Verificando lançamentos no meusanimes.blog...");
    const lancamentos = await capturarLancamentos();
    if (lancamentos.length === 0) {
      console.log("Nenhum lançamento encontrado no site.");
      return;
    }

    const maisRecente = lancamentos[0];

    let ultimoSalvo = "";
    if (fs.existsSync("ultimo_episodio.txt")) {
      ultimoSalvo = fs.readFileSync("ultimo_episodio.txt", "utf-8").trim();
    }

    if (maisRecente !== ultimoSalvo) {
      console.log(`Novo lançamento detectado: ${maisRecente}`);

      const mensagem = `📺 *Novo Episódio no MeusAnimes!*\n\n🍿 ${maisRecente}`;
      const enviado = await enviarWhatsApp(mensagem);

      if (enviado) {
        console.log("Notificação enviada com sucesso!");
        fs.writeFileSync("ultimo_episodio.txt", maisRecente);

        // Salva na lista do dia para o resumo de 22h
        fs.appendFileSync("lancamentos_hoje.txt", `${maisRecente}\n`);
      }
    } else {
      console.log("Nenhum episódio novo por enquanto.");
    }

  } catch (erro) {
    console.error("Erro ao executar bot:", erro);
  }
}

executarBot();
