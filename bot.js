import fs from 'fs';

const telefone = "5511953622481";
const apikey = "7271489"; // <-- COLOQUE SUA APIKEY AQUI

async function verificarNovidades() {
  try {
    // 1. Defina o nome do anime/episódio capturado do site
    const nomeDoAnime = "Novo Episódio Encontrado!"; // Aqui entra a sua lógica de raspagem/fetch do site

    // 2. Lê o último episódio salvo no arquivo
    let ultimoSalvo = "";
    if (fs.existsSync("ultimo_episodio.txt")) {
      ultimoSalvo = fs.readFileSync("ultimo_episodio.txt", "utf-8").trim();
    }

    // 3. Compara se há novidade
    if (nomeDoAnime !== ultimoSalvo) {
      console.log("Novo episódio detectado. Enviando mensagem...");

      // Monta a mensagem e codifica a URL corretamente
      const mensagem = `Novo episódio disponível: ${nomeDoAnime}`;
      const url = `https://api.callmebot.com/whatsapp.php?phone=${telefone}&text=${encodeURIComponent(mensagem)}&apikey=${apikey}`;

      const resposta = await fetch(url);
      
      if (resposta.ok) {
        console.log("Mensagem enviada com sucesso para o WhatsApp!");
        // Salva o novo episódio no arquivo para não repetir
        fs.writeFileSync("ultimo_episodio.txt", nomeDoAnime);
      } else {
        console.error("Erro ao enviar mensagem pelo CallMeBot:", resposta.statusText);
      }
    } else {
      console.log("Nenhum episódio novo por enquanto.");
    }
  } catch (erro) {
    console.error("Erro na execução do bot:", erro);
  }
}

verificarNovidades();
