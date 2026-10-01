import fs from 'fs';
import * as cheerio from 'cheerio';

const telefone = "5511953622481";
const apikey = "7271489"; // <-- COLOQUE SUA APIKEY NUMÉRICA AQUI
const siteUrl = "https://meusanimes.blog/";

async function verificarNovidades() {
  try {
    console.log("Acessando o site meusanimes.blog...");
    
    // 1. Requisita a página do site
    const respostaSite = await fetch(siteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!respostaSite.ok) {
      console.error(`Erro ao carregar o site. Status: ${respostaSite.status}`);
      return;
    }

    const html = await respostaSite.text();
    const $ = cheerio.load(html);

    // 2. Extrai as informações do lançamento
    let textoEpisodio = "";

    $('.episodes-list .item, .last-episodes .item, article').first().each((i, el) => {
      textoEpisodio = $(el).text().trim().replace(/\s+/g, ' ');
    });

    // Se o seletor acima for vazio, busca pelo primeiro link de episódio
    if (!textoEpisodio) {
      $('a[href*="episodio"]').first().each((i, el) => {
        textoEpisodio = $(el).attr('title') \vert{}\vert{}$(el).text().trim();
      });
    }

    if (!textoEpisodio) {
      console.log("Não foi possível extrair a informação do lançamento no momento.");
      return;
    }

    const lancamentoDetectado = textoEpisodio.replace(/\s+/g, ' ').trim();

    // 3. Lê o histórico salvo
    let ultimoSalvo = "";
    if (fs.existsSync("ultimo_episodio.txt")) {
      ultimoSalvo = fs.readFileSync("ultimo_episodio.txt", "utf-8").trim();
    }

    // 4. Envia para o WhatsApp se for novidade
    if (lancamentoDetectado !== ultimoSalvo) {
      console.log(`Novo lançamento encontrado: "${lancamentoDetectado}"`);

      const mensagem = `📺 *Novo Episódio no MeusAnimes!*\n\n🍿 ${lancamentoDetectado}`;
      const urlCallMeBot = `https://api.callmebot.com/whatsapp.php?phone=${telefone}&text=${encodeURIComponent(mensagem)}&apikey=${apikey}`;

      const respostaBot = await fetch(urlCallMeBot);

      if (respostaBot.ok) {
        console.log("Mensagem enviada com sucesso para o WhatsApp!");
        fs.writeFileSync("ultimo_episodio.txt", lancamentoDetectado);
      } else {
        console.error("Erro ao enviar mensagem pelo CallMeBot:", respostaBot.statusText);
      }
    } else {
      console.log("Nenhum episódio novo por enquanto.");
    }
  } catch (erro) {
    console.error("Erro durante a execução do bot:", erro);
  }
}

verificarNovidades();
