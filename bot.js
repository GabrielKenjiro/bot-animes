import fs from 'fs';
import * as cheerio from 'cheerio';

const telefone = "5511953622481";
const apikey = "7271489"; // <-- COLOQUE SUA APIKEY NUMÉRICA AQUI
const siteUrl = "https://meusanimes.blog/";

async function verificarNovidades() {
  try {
    console.log("Acessando o site meusanimes.blog...");
    
    // 1. Faz a requisição para o site
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

    // 2. Busca o primeiro item da lista de "Últimos Episódios" do site
    // O site estrutura a lista com a classe ou texto do episódio lançado
    let textoEpisodio = "";

    // Procura na área de lançamentos/últimos episódios
    $('.episodes-list .item, .last-episodes .item, article').first().each((i, el) => {
      textoEpisodio = $(el).text().trim().replace(/\s+/g, ' ');
    });

    // Caso a busca acima venha vazia, usamos um seletor genérico para capturar o primeiro link de episódio
    if (!textoEpisodio) {
      $('a[href*="episodio"]').first().each((i, el) => {
        textoEpisodio = $(el).attr('title') \vert{}\vert{}$(el).text().trim();
      });
    }

    if (!textoEpisodio) {
      console.log("Não foi possível extrair a informação do lançamento no momento.");
      return;
    }

    // Limpa e organiza o texto para a mensagem
    const lancamentoDetectado = textoEpisodio.replace(/\s+/g, ' ').trim();

    // 3. Lê o último episódio salvo no arquivo local
    let ultimoSalvo = "";
    if (fs.existsSync("ultimo_episodio.txt")) {
      ultimoSalvo = fs.readFileSync("ultimo_episodio.txt", "utf-8").trim();
    }

    // 4. Se for um lançamento novo, dispara o WhatsApp
    if (lancamentoDetectado !== ultimoSalvo) {
      console.log(`Novo lançamento encontrado: "${lancamentoDetectado}"`);

      const mensagem = `📺 *Novo Episódio no MeusAnimes!*\n\n🍿 ${lancamentoDetectado}`;
      const urlCallMeBot = `https://api.callmebot.com/whatsapp.php?phone=${telefone}&text=${encodeURIComponent(mensagem)}&apikey=${apikey}`;

      const respostaBot = await fetch(urlCallMeBot);

      if (respostaBot.ok) {
        console.log("Mensagem enviada com sucesso para o WhatsApp!");
        // Salva o novo lançamento no arquivo para não repetir
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
