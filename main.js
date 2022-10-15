/* Servidor para mini_dic
 * Atende a solicitações de acesso ao dicionário.
 * Exemplo:
 *  HTTP GET no formato: /verbetes?inicio=1&fim=4
 *  Retorna linhas com verbetes solicitados (modo texto, utf-8).
 * Serve os arquivos do cliente para solicitações iniciadas por /mini_dic/
 *
 * author: João Vianna (jvianna@gmail.com)
 * date: 2022-10-07
 * version: 0.8.0
 * history:
 * 0.8.0 - Atendendo a solicitações com dicionários independentes para cada cliente.
 * 
 * Copyleft 2022 João Vianna (jvianna@gmail.com)
 * Este produto é distribuído sob os termos de licenciamento da
 * 'Apache License, Version 2.0'
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

/* Retorna o ip da máquina onde o programa está rodando.
   Copiado de exemplo em stackoverflow.com, usuário jhurliman
*/
function getIPAddress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }
  return '127.0.0.1';
}

/* ---------------------------------------------------------------------------
  Lógica do programa
  Operações:
    lerNomesDicionarios() - Prepara lista de dicionários disponíveis;
    carregarDicionario() - Lê o arquivo de dicionário para consultas subsequentes;
    obterVerbetes() - Devolve a lista de verbetes entre as posições dadas;
  Função utilitária:
    buscaBinaria() - Encontra a posição mais próxima de um texto em uma lista
                     pré-ordenada.
    
*/

/* Busca binária em uma lista pré-ordenada.
    Retorna:
      number: índice do ponto de inserção.
*/
function buscaBinaria(lista, chave) {
  var ind_base = -1;
  var ind_fim = lista.length - 1;
  var ind_meio;

  while (ind_base < ind_fim) {
    ind_meio = Math.floor((ind_base + ind_fim + 1) / 2);

    if (ind_meio == ind_base) {
      ind_fim = ind_base;
    } else {
      if (chave < lista[ind_meio]) {
        ind_fim = ind_meio - 1;
      } else {
        ind_base = ind_meio;
      }
    }
  }
  return ind_base
}

// Nomes dos arquivos de dicionário
let dicionarios = [];


class DicLido {
  constructor(nome, n_linhas) {
    this.info = {arquivo: nome, tamanho: n_linhas};
    this.verbetes = [];
  }
}

/* Informações sobre dicionários lidos
  arquivo - Nome do arquivo deste dicionário
  tamanho - tamanho do arquivo (linhas)
  verbetes - Lista de verbetes no dicionário 
*/
let dic_lidos = new Map();


/* Recupera os nomes dos arquivos de dicionário existentes na pasta recursos
*/
function lerNomesDicionarios() {
  fs.readdir(path.resolve('recursos', ''), 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    dicionarios = data;

    console.log('Dicionários:');
    console.log(dicionarios)
  })
}


/* Leitura do arquivo de dicionario
*/
function carregarDicionario(nome_dic) {
  if (dic_lidos.has(nome_dic)) {
    return dic_lidos.get(nome_dic).info;
  } else {
    var dados = fs.readFileSync(path.resolve('recursos', nome_dic), 'utf8');
  
    var verbetes = dados.split('\n');
  
    var dic_atual = new DicLido(nome_dic, verbetes.length);
  
    dic_atual.verbetes = verbetes;
    
    dic_lidos.set(nome_dic, dic_atual);
    return dic_atual.info;
  }
}

/* Obtém definições de verbetes entre as posições solicitadas.
*/
function obterVerbetes(nome_dic, inicio, fim) {
  if (dic_lidos.has(nome_dic)) {
    var dic_atual = dic_lidos.get(nome_dic);

    if (fim > dic_atual.verbetes.length) {
      fim = dic_atual.verbetes.length;
    }
    if ((inicio >= 0) &&
        (inicio < dic_atual.verbetes.length) &&
        (inicio < fim)) {
      return dic_atual.verbetes.slice(inicio, fim).join('\n');
    }
  }
  return '';
}


/* Busca um verbete no dicionário
*/
function buscarVerbete(nome_dic, verbete) {
  if (dic_lidos.has(nome_dic)) {
    var dic_atual = dic_lidos.get(nome_dic);
    // Nota: Os dicionários têm os verbetes em caixa baixa e ordenados alfabeticamente.
    return buscaBinaria(dic_atual.verbetes, verbete.toLowerCase()).toString();
  }
  return '0';
}

/* ---------------------------------------------------------------------------
  Protocolo cliente/servidor...
  Recupera arquivos do cliente, mini_dic.html quando a solicitação é do tipo:
    /mini_dic/.../aquivo.suf
  Atende a solicitações do tipo GET
*/

const solicitacoes = new Set([
    '/verbetes',      // Retorna lista de verbetes entre as posições dadas
    '/carregar',      // Realiza a leitura do dicionário dado, para consultas
    '/buscar',        // Retorna a posição mais próxima de um verbete no dicionário
    '/dicionarios',   // Retorna a lista dos dicionários disponíveis
    '/terminar']);    // Termina a execução do lado do servidor

/* Trata solicitações do tipo GET, gerando a resposta solicitada.
*/
function tratarPedido(url_solicitada) {
  if (url_solicitada.pathname == '/verbetes') {
    // Solicitação do tipo: /verbetes?dic=en_pt.csv&inicio=0&fim=10
    let nome_dic = url_solicitada.searchParams.get('dic');
    let inicio = parseInt(url_solicitada.searchParams.get('inicio'));
    let fim = parseInt(url_solicitada.searchParams.get('fim'));

    if (isNaN(inicio) || isNaN(fim)) {
      // Erro na solicitação
      return '';
    } else {
      return obterVerbetes(nome_dic, inicio, fim);
    }
  } else if (url_solicitada.pathname == '/buscar') {
    // Solicitação do tipo: /buscar?dic=en_pt.csv&verbete=love
    let nome_dic = url_solicitada.searchParams.get('dic');
    let verbete = url_solicitada.searchParams.get('verbete');
    return buscarVerbete(nome_dic, verbete);
  } else if (url_solicitada.pathname == '/carregar') {
    // Solicitação do tipo: /carregar?dicionario=en_pt.csv
    let info = carregarDicionario(url_solicitada.searchParams.get('dicionario'));
    console.log(info.tamanho);
    return info.tamanho.toString();
  } else if (url_solicitada.pathname == '/dicionarios') {
    return dicionarios.join('\n');
  } else if (url_solicitada.pathname == '/terminar') {
    process.kill(process.pid, 'SIGTERM')
  }
  return '';
}

// Tipos de arquivos conhecidos, mapeados para MIME Content-Type
const tipos = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.htm', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ]);

/* Atende a solicitações de arquivos do lado do cliente de forma assíncrona.
  Retorna:
  object: Estrutura contendo status, tipo e conteúdo do arquivo
*/
function lerArquivoCliente(rota_arquivo, res) {

  if (rota_arquivo == '/') {
    // O default é a aplicação principal.
    rota_arquivo = '/index.html'
  }
  var rota_interna = path.resolve('cliente', '.' + rota_arquivo);
  
  console.log(rota_interna);

  var pos_sufixo = rota_arquivo.lastIndexOf('.');
  
  // Só vamos servir arquivos com algum sufixo
  if (pos_sufixo > 0) {
    // Conteúdo default
    var tipo_conteudo = 'text/plain; charset=utf-8';
    
    if (tipos.has(rota_arquivo.slice(pos_sufixo))) {
      tipo_conteudo = tipos.get(rota_arquivo.slice(pos_sufixo));
    }
    
    if (tipo_conteudo.startsWith('text/')) {
      // Arquivo de texto
      // Nota: Esta implementação só funciona para arquivos de texto curtos.
      // Para um servir arquivos estáticos diversos em node_js, ver módulo express!
      fs.readFile(rota_interna, 'utf8', function (erro, conteudo) {
        if (erro) {
          // Arquivo não encontrado (ERR Not Found)!
          res.statusCode = 404;
          res.end('Não encontrado');
        } else {
          // O arquivo existe! Repassamos o conteúdo.
          res.statusCode = 200;
          res.setHeader('Content-Type', tipo_conteudo);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(conteudo);
        }
      });
    } else {
      // Outros tipos de arquivos podem ser mais longos. Vamos usar outro método...
      var readStream = fs.createReadStream(rota_interna);
      
      res.setHeader('Content-Type', tipo_conteudo);
      res.setHeader('Access-Control-Allow-Origin', '*');

      try {
        readStream.pipe(res);
      } catch (erro) {
        console.log('Erro usando stream/pipe... ' + rota_interna);
        res.statusCode = 404;
        res.end('Não encontrado');
      }
    }
  } else {
    // Arquivo não encontrado (ERR Not Found)!
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('Não encontrado');
  }
}



// Tratamento do protocolo HTTP

// Endereço do servidor
// const ip_servidor = '127.0.0.1';
var ip_servidor = getIPAddress();

var porta = 8080;      // porta default

const servidorHTTP = http.createServer();


servidorHTTP.on('request', (req, res) => {
  console.log('Atendendo à solicitação:');
  console.log(req.url);
  // console.log(req.headers);
  // Alternativa: console.log(JSON.stringify(req, null, 2));
  
  var url_solicitada = new URL(req.url, `http://${req.headers.host}`);

  if (solicitacoes.has(url_solicitada.pathname)) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');  
    res.end(tratarPedido(url_solicitada));
  } else if (url_solicitada.pathname.indexOf('../') < 0) {
    console.log('Solicitação de arquivo');
    console.log(url_solicitada.pathname);
    
    // Ler o arquivo pode demorar. Prepara resposta assíncrona
    lerArquivoCliente(url_solicitada.pathname, res);
  }
  else {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Solicitação inválida');
  }
});

// Dando partida no servidor

// Encontra os dicionários disponíveis para consulta
lerNomesDicionarios();


if (process.argv.length == 3) {
  /* O primeiro argumento passado é
     o número da porta em que o servidor vai receber solicitações.
  */
  // console.log(process.argv);
  porta = parseInt(process.argv[2]);
}

servidorHTTP.listen(porta, ip_servidor, () => {
  console.log('Servidor mini_dic rodando em http://' + ip_servidor + ':' + porta + '/');
});

// Encerramento do servidor
process.on('SIGTERM', () => {
  servidorHTTP.close(() => {
    console.log('Servidor mini_dic encerrado.')
  })
})

