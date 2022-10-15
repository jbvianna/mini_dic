/* Aplicativo - Mini Dic
 * Exemplo de programação em Javascript (cliente).
 * author: João Vianna (jvianna@gmail.com)
 * date: 2022-10-07
 * version: 0.7.0
 * 
 * Copyleft 2020 João Vianna (jvianna@gmail.com)
 * Este produto é distribuído sob os termos de licenciamento da
 * 'Apache License, Version 2.0'
 */
'use strict';


// Referências à Vista
// Lista de dicionários disponíveis
const lsDicionarios = document.getElementById('ls-dicionarios');

// Texto com a palavra a buscar
const txPalavra = document.getElementById('tx-palavra');

// Botão para buscar palavra no dicionário
const btBuscar = document.getElementById('bt-buscar');

//Botões de navegação na lista de verbetes
const btInicio = document.getElementById('bt-inicio');
const btAnterior = document.getElementById('bt-anterior');
const btProxima = document.getElementById('bt-proxima');
const btFim = document.getElementById('bt-fim');

// Lista de verbetes que está visível
const lsVerbetes = document.getElementById('ls-verbetes');

// Texto para mostrar definição de verbete.
const txDefinicao = document.getElementById('tx-definicao');

// const base_servidor = "http://127.0.0.1:2999/";
const base_servidor = "./";

// Dados para o programa
const tamanho_lista_verbetes = 10;

// Informações sobre o arquivo de dicionário corrente.
let dic_info = {'arquivo': 'vazio', 'tamanho': 0};

// Verbetes que foram recuperados para a lista de verbetes (ver lsVerbetes)
let verbetes_visiveis = {};

let posicao_verbetes = 0;

/* Preenche definição de um verbete escolhido no dicionário.
    Parâmetros:
      ind:number - Posição do verbete na lista de verbetes visíveis
*/
function preencherVerbete(ind) {
  var linha = verbetes_visiveis[ind];
  var partes = linha.split('\t');

  txDefinicao.innerText ='';
  txDefinicao.appendChild(document.createTextNode(partes.join('\n')));
}


/* Preenche a lista de verbetes com a lista recebida
    As linhas da lista são partes de uma tabela CSV com separador TAB,
    onde o primeiro campo é o verbete.
    
    Parâmetros:
      inicio: number - Posição inicial da lista no dicionário
      texto_lista: string - Texto com linhas escolhidas do dicionário
*/
function completarListaVerbetes(inicio, texto_lista) {
  var verbetes = texto_lista.split('\n');
  var opcao;
  var linha;
  var campos;
  var verbete;
  var posicao;
  
  // Limpa opções anteriores.
  verbetes_visiveis = {};

  lsVerbetes.innerHTML = '';

  for (var ind = 0; ind < verbetes.length; ind++) {
    posicao = inicio + ind;
    linha = verbetes[ind];

    if (linha.length > 0) {
      campos = linha.split('\t');
      verbete = campos[0];
      
      verbetes_visiveis[posicao] = linha;

      opcao = document.createElement('OPTION');
      opcao.appendChild(document.createTextNode(posicao.toString() + ". " + verbete));
    
      lsVerbetes.appendChild(opcao);
    }
  }
}

/* Solicita ao servidor uma lista de verbetes,
   e preenche a lista de verbetes visíveis com o resultado.
    Parâmetros:
      inicio: number - Posição inicial da lista desejada
      tamanho: number - Número de verbetes desejados
*/
function preencherListaVerbetes(inicio = 0, tamanho = dic_info.tamanho) {
  var xhttp = new XMLHttpRequest();
  
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      // Se houve sucesso, preencher a lista de verbetes visíveis.
      completarListaVerbetes(inicio, this.responseText);
    }
  };
  xhttp.open('GET', base_servidor + 'verbetes?dic=' + dic_info.arquivo +
                                    '&inicio=' + inicio.toString() +
                                    '&fim=' + (inicio + tamanho).toString(), true);
  xhttp.send();
}

/* Trata seleção de um verbete, mostrando sua definição na área apropriada.
*/
function selecionarVerbete() {
  var selecao = this.value;
  
  preencherVerbete(parseInt(selecao));
}

lsVerbetes.addEventListener('change', selecionarVerbete);


/* Solicita ao servidor a leitura do dicionário escolhido e
   preenche a lista de verbetes com as primeiras palavras recebidas.
*/
function carregarDicionario() {
  if (this.value) {
    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        dic_info.tamanho = parseInt(this.responseText);

        txDefinicao.innerText = this.responseText;
  
        posicao_verbetes = 0;
    
        preencherListaVerbetes(posicao_verbetes, tamanho_lista_verbetes);
      }
    };
    dic_info.arquivo = this.value;
    xhttp.open('GET', base_servidor + 'carregar?dicionario=' + dic_info.arquivo, true);
    xhttp.send();
  }
}


lsDicionarios.addEventListener('change', carregarDicionario);


// Navegação na lista de verbetes
function navegarInicioVerbetes() {
  posicao_verbetes = 0;
  
  preencherListaVerbetes(posicao_verbetes, tamanho_lista_verbetes);
}

btInicio.addEventListener('click', navegarInicioVerbetes);


function navegarFimVerbetes() {
  if (dic_info.tamanho > tamanho_lista_verbetes - 1) {
    posicao_verbetes = dic_info.tamanho - tamanho_lista_verbetes + 1;
  } else {
    posicao_verbetes = 0;
  }
  
  preencherListaVerbetes(posicao_verbetes, tamanho_lista_verbetes);
}

btFim.addEventListener('click', navegarFimVerbetes);


function navegarAnteriorVerbetes() {
  if (posicao_verbetes > (tamanho_lista_verbetes - 2)) {
    posicao_verbetes -= (tamanho_lista_verbetes - 2);
  } else {
    posicao_verbetes = 0;
  }
  
  preencherListaVerbetes(posicao_verbetes, tamanho_lista_verbetes);
}

btAnterior.addEventListener("click", navegarAnteriorVerbetes);


function navegarProximaVerbetes() {
  if ((posicao_verbetes + tamanho_lista_verbetes - 2) < dic_info.tamanho) {
    posicao_verbetes += (tamanho_lista_verbetes - 2);

    preencherListaVerbetes(posicao_verbetes, tamanho_lista_verbetes);
  } else {
    navegarFimVerbetes();
  }
}

btProxima.addEventListener("click", navegarProximaVerbetes);


// Tratamento do botão Buscar. Gera lista com palavras próximas à buscada.
function buscarPalavra() {
  var xhttp = new XMLHttpRequest();
  
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var tamanho_meia_lista = Math.floor(tamanho_lista_verbetes / 2);

      posicao_verbetes = parseInt(this.responseText);

      if (posicao_verbetes > tamanho_meia_lista) {
        posicao_verbetes -= tamanho_meia_lista;
      } else {
        posicao_verbetes = 0;
      }
      preencherListaVerbetes(posicao_verbetes, tamanho_lista_verbetes);
    }
  };
  xhttp.open('GET', base_servidor + 'buscar?dic=' + dic_info.arquivo +
                                    '&verbete=' + txPalavra.value, true);
  xhttp.send();
}

btBuscar.addEventListener('click', buscarPalavra);


function preencherListaDicionarios() {
  var xhttp = new XMLHttpRequest();
  
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var lista_dic = this.responseText.split('\n');
      var opcao = document.createElement('OPTION');

      lsDicionarios.innerHTML = '';
    
      // Começa com uma opção vazia.
      opcao.appendChild(document.createTextNode(''));
    
      lsDicionarios.appendChild(opcao);

      for (var ind = 0; ind < lista_dic.length; ind++) {
        opcao = document.createElement('OPTION');
        opcao.appendChild(document.createTextNode(lista_dic[ind]));
      
        lsDicionarios.appendChild(opcao);
      }
    }
  }
  xhttp.open('GET', base_servidor + 'dicionarios');
  xhttp.send();
}

window.addEventListener('load', preencherListaDicionarios);
