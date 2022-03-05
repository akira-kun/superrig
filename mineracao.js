document.title='SuperRig - Painel';

var dadosMineracao;
var preco = 0;
var megahash = 0;
var areceber = 0;
var mineradoatehoje = 0;
var sacadoatehoje = 0;
var nacarteira = 0;
var ultimopagamento = 0;
var meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Novembro", "Dezembro"];

let myScript = document.createElement("script");
myScript.setAttribute("src", "https://api.allorigins.win/get?callback=pegaDados&url=https://raw.githubusercontent.com/akira-kun/superrig/main/mineracao.json?t="+Math.random());
//myScript.setAttribute("src", "mineracao.json");
document.body.appendChild(myScript);

function pegaDados(a) {

    //mes
    var hoje = new Date();
    var mes = ("00".substring(0, 2 - (""+(hoje.getMonth()+1)).length) + (""+(hoje.getMonth()+1))) + "-" + (hoje.getYear()+1900);
    document.getElementById("sel_mes").getElementsByTagName("span")[0].innerHTML = meses[hoje.getMonth()] + " " + (hoje.getYear()+1900);

    dadosMineracao = JSON.parse(a["contents"]);
    //document.getElementById("tela").innerHTML="<pre style='background: #FFF'>"+JSON.stringify(dadosMineracao,null,2)+"</pre>";
    console.log(dadosMineracao);

    ultimopagamento = dadosMineracao["ultimos_pagamentos"][0];
    ultimopagamento = ultimopagamento.split("-");
    ultimopagamento = new Date(ultimopagamento[2], ultimopagamento[1] - 1, ultimopagamento[0]);
    ultimopagamento_mais1 = ultimopagamento;
    ultimopagamento_mais1 = new Date(ultimopagamento_mais1.setDate(ultimopagamento_mais1.getDate() + 1));
    var ultimodiames = new Date((hoje.getYear() + 1900), hoje.getMonth() + 1, 0);

    var totalParticipacao = 0;
    var totalMhs = 0;
    var totalEnergia = 0;
    for (i in dadosMineracao["dono"]) {
        tpl.cadastrar(i, "id", i);
        tpl.cadastrar(i, "nome", dadosMineracao["dono"][i]);
        //participacao
        var participacao = 0;
        var placas = [];
        var energia = 0;
        var mhs = 0;
        for (j in dadosMineracao["dono_gpu_tempo_uso"][i]) {
            var data_inicial = dadosMineracao["dono_gpu_tempo_uso"][i][j][0];
            if (!dataMaior(data_inicial, ultimopagamento_mais1)) {
                data_inicial = ultimopagamento_mais1;
            } else {
                data_inicial = converterData(data_inicial);
            }
            
            var data_final = hoje;
            if (dadosMineracao["dono_gpu_tempo_uso"][i][j][1] != null)
                data_final = converterData(dadosMineracao["dono_gpu_tempo_uso"][i][j][1]);
            
            if (data_final > data_inicial) {
                data_final = ultimodiames;
                if (dadosMineracao["dono_gpu_tempo_uso"][i][j][1] != null) 
                    data_final = converterData(dadosMineracao["dono_gpu_tempo_uso"][i][j][1]);
            }
            else {
                data_final = data_inicial;
            }
            var diff = Math.ceil(Math.abs((data_final - data_inicial) / (24 * 60 * 60 * 1000))) + 1;
 //  diff = 31;
 //if (j==11) diff = 8;
 //if (j==9) diff = 22;
 //if (j==10) diff = 16;
            participacao+= diff * dadosMineracao["gpus"][j][2];
            placas.push(dadosMineracao["gpus"][j][1] + "("+diff+")");
            energia+= parseFloat(dadosMineracao["gpus"][j][3]);
            mhs+= parseFloat(dadosMineracao["gpus"][j][2]);
            //alert(dadosMineracao["dono"][i] + " " + dadosMineracao["gpus"][j][2] + "("+j+") : " + participacao);
        }
        totalParticipacao+= participacao;
        totalMhs+= mhs;
        totalEnergia+= energia;
        tpl.cadastrar(i, "participacao", participacao);
        tpl.cadastrar(i, "placas", placas);
        tpl.cadastrar(i, "energia", energia);
        tpl.cadastrar(i, "mhs", mhs);

    }
    
    document.getElementById("total_mhs").innerHTML = totalMhs.toFixed(1) + " mh/s";
    document.getElementById("total_consumo").innerHTML = totalEnergia + "w";

    mineradoatehoje = 0;
    for (i in dadosMineracao["dono"]) {
        tpl.cadastrar(i, "participacao", (tpl.dados[i].participacao/totalParticipacao));
        tpl.cadastrar(i, "porcentagem", (tpl.dados[i].participacao*100).toFixed(2));
        //console.log(i, tpl.dados[i].porcentagem);

        var totalSaque = 0;
        var totalSaqueBRL = 0;
        for (j in dadosMineracao["saques"]) {
            if (dadosMineracao["saques"][j][i] != null) {
                for (k in dadosMineracao["saques"][j][i]) {
                    totalSaque+= parseFloat(dadosMineracao["saques"][j][i][k][0]);
                    totalSaqueBRL+= parseFloat(dadosMineracao["saques"][j][i][k][1]);
                }
            }
        }
        sacadoatehoje+= totalSaque;
        tpl.cadastrar(i, "sacado", totalSaque);
        tpl.cadastrar(i, "sacado_brl", totalSaqueBRL.toFixed(2));
        tpl.cadastrar(i, "disponivel", totalMinerado-totalSaque);

        var totalMinerado = 0;
        for (j in dadosMineracao["ganhos"]) {
            if (j != mes && dadosMineracao["ganhos"][j][i] != null) {
                totalMinerado+= parseFloat(dadosMineracao["ganhos"][j][i]);
            }
        }
        mineradoatehoje+= totalMinerado-totalSaque;
        tpl.cadastrar(i, "recebido", totalMinerado);
        tpl.cadastrar(i, "progresso", ((dadosMineracao["dono_investimento"][i]*100)/(preco*totalMinerado)).toFixed(0));

    }
    nacarteira = mineradoatehoje;
    console.log(tpl.dados);

    let myScript2 = document.createElement("script");
    myScript2.setAttribute("src", "https://api.allorigins.win/get?t="+Math.random()+"&callback=staticPrice&url=https://api.binance.com/api/v3/ticker/price?symbol=ETHBRL");
    document.body.appendChild(myScript2);

    setInterval(atualizaAReceber,60000);

    tpl.renderizar(1);

    const pricesWs = new WebSocket('wss://stream.binance.com:9443/ws')
    //const pricesWs = new WebSocket('wss://ws.coincap.io/prices?assets=ethereum')

    var msg = {
      "method": "SUBSCRIBE",
      "params": ["ethbrl@ticker"],
      "id": 1
    };

    pricesWs.onopen = function () {
        pricesWs.send(JSON.stringify(msg));
    }
    pricesWs.onmessage = function (msg) {
        var o = JSON.parse(msg.data);
        if (o["c"] != undefined) {
            atualiza(o["c"]);
        }
    }

}

function verMes() {
    document.getElementById("outMenu").style.display = "block";
    document.getElementById("mes").style.display = "block";
}
function fechaMenus() {
    document.getElementById("outMenu").style.display = "none";
    document.getElementById("mes").style.display = "none";
}

function statusReceber(unpaid) {
    document.getElementById("areceber").innerHTML = unpaid.toFixed(5) + " ETH";
    document.getElementById("areceber").nextSibling.innerHTML = "R$ " + (preco * unpaid).toFixed(2);
}
function statusMinerado(minerado) {
    minerado+= areceber;
    document.getElementById("minerado").innerHTML = minerado.toFixed(5) + " ETH";
    document.getElementById("minerado").nextSibling.innerHTML = "R$ " + (preco * minerado).toFixed(2);
}
function statusCarteira() {
    var carteira = nacarteira;
    document.getElementById("carteira").innerHTML = carteira.toFixed(8) + " ETH";
    document.getElementById("carteira").nextSibling.innerHTML = "R$ " + (preco * carteira).toFixed(2);
}

function atualiza(c) {
    preco = (c*1).toFixed(2);
    preco_ = (c*1).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    document.getElementById("preco_ethbrl").innerHTML= "R$ "+preco_;
    document.title = preco_ + ' SuperRig Druida - Painel';
    if (areceber > 0) {
        statusReceber(areceber);
        statusMinerado(mineradoatehoje);
        statusCarteira();
        for (id in dadosMineracao["dono"]) {
            if (document.getElementById("ganho_brl_id_" + id) != null)
                document.getElementById("ganho_brl_id_" + id).innerHTML = "R$ " + (preco * tpl.dados[id]["ganho_mensal"]).toFixed(2);
            if (document.getElementById("recebido_mineracao_brl_id_" + id) != null)
                document.getElementById("recebido_mineracao_brl_id_" + id).innerHTML = "R$ " + (preco * (tpl.dados[id]["recebido"]+tpl.dados[id]["ganho_mensal"])).toFixed(2);
            if (document.getElementById("disponivel_brl_id_" + id) != null)
                document.getElementById("disponivel_brl_id_" + id).innerHTML = "R$ " + (preco * (tpl.dados[id]["recebido"]+tpl.dados[id]["ganho_mensal"]-tpl.dados[id]["sacado"])).toFixed(2);
        }
    }
}

function atualizaAReceber() {
    fetch("https://api.ethermine.org/miner/8ca7c223F36a879b08A275C5eAF20f7eA80f1580/dashboard").then(function(e){
        return e.json();
    }).then(function (data) {
        document.getElementById("total_mhs").innerHTML = (data.data.currentStatistics.reportedHashrate / 1000000).toFixed(1) + " mh/s";
        areceber = data.data.currentStatistics.unpaid/1000000000000000000;
        //areceber = 0.22761358;
        //areceber+= 0.01933;
        areceber+= 0.02021;
        statusReceber(areceber);
        statusMinerado(mineradoatehoje);
        statusCarteira();
        tpl.resetView();
        for (i in dadosMineracao["dono"]) {
            if (tpl.dados[i].participacao > 0)
               tpl.cadastrar(i, "ganho_mensal", areceber*tpl.dados[i].participacao);
            if (dadosMineracao["ganhos"][mes] != null) {
                if (dadosMineracao["ganhos"][mes][i] != null && dadosMineracao["ganhos"][mes][i] != "") {
                    tpl.cadastrar(i, "ganho_mensal", dadosMineracao["ganhos"][mes][i]);
                }
                //alert(JSON.stringify(dadosMineracao["ganhos"][mes][i]) + " : " + parseFloat(tpl.dados[i].ganho_mensal))
            }
            if (i == 5) dadosMineracao["dono_investimento"][i] = 4740;
            tpl.cadastrar(i, "progresso", ((preco*(tpl.dados[i].recebido+tpl.dados[i].ganho_mensal)*100) / (dadosMineracao["dono_investimento"][i])).toFixed(2));
            //console.log(i, preco, tpl.dados[i].recebido, tpl.dados[i].ganho_mensal, dadosMineracao["dono_investimento"][i], ((preco*(tpl.dados[i].recebido+tpl.dados[i].ganho_mensal)*100) / (dadosMineracao["dono_investimento"][i])));//.toFixed(1)
            //console.log(i, tpl.dados[i].progresso);
            //console.log(i, tpl.dados[i].ganho_mensal.toFixed(5));
            //alert((tpl.dados[i].porcentagem) + " --- (" +totalParticipacao+ ") " + dadosMineracao["dono"][i] + " " + dadosMineracao["gpus"][j][2] + "("+j+") : " + participacao);
            tpl.renderizar(i);
        }

        //console.log(tpl.dados);
    
    }).catch(function (err) {
        console.warn('Something went wrong.', err);
    });
}

function converterData(strData) {
    var partesData = strData.split("-");
    return new Date(partesData[2], partesData[1] - 1, partesData[0]);
}
function dataMaior(strData, strData2) {
    var data = converterData(strData);
    var data2 = new Date();
    if (strData2 != null && typeof strData2.getMonth === 'String') {
        data2 = converterData(strData2);
    } else {
        data2 = strData2;
    }

    if(data > data2) {
       return true;
    }
    return false;
}

function staticPrice(a) {
    var o = JSON.parse(a["contents"]);
    atualiza(o.price);
    atualizaAReceber();
}

var tpl = {
    mainId: "",
    template: "",
    dados: {},
    cadastrar: function(id, item, d) {
        if (tpl.dados[id] == null) {
            tpl.dados[id] = dados();
        }
        tpl.dados[id][item] = d;
    },
    resetView: function () {
         document.getElementById("tbody-ganhos").innerHTML = "";
    },
    renderizar: function(id) {
        if (id == null) {
            //document.getElementById("tbody-ganhos").innerHTML = "";
            //document.getElementById("tbody-ganhos").innerHTML+= this.converter(this.dados[i]);
        } else {
            //document.getElementById("tbody-ganhos").getElementsByTagName("tr")[0].innerHTML = "";
            document.getElementById("tbody-ganhos").innerHTML+= this.converter(id);
        }
    },
    converter: function(id) {
        var t = this.template;

        if (id != null) {
            for (i in this.dados[id]) {
                switch (i) {
                    case "id":
                        t = t.replace("[" + i + "]", this.dados[id][i]);
                        t = t.replace("[" + i + "]", this.dados[id][i]);
                        t = t.replace("[" + i + "]", this.dados[id][i]);
                        t = t.replace("[" + i + "]", this.dados[id][i]);
                        break;
                    case "progresso":
                        t = t.replace("[progresso]", this.dados[id][i]);
                        t = t.replace("[progresso]", this.dados[id][i]);
                        break;
                    case "recebido":
                        t = t.replace("[recebido_mineracao]", (this.dados[id][i] + tpl.dados[id]["ganho_mensal"]).toFixed(5));
                        t = t.replace("[recebido_mineracao_brl]", (preco * (this.dados[id][i] + tpl.dados[id]["ganho_mensal"])).toFixed(2));
                        break;
                    case "ganho_mensal":
                        t = t.replace("[" + i + "]", this.dados[id][i].toFixed(5));
                        t = t.replace("[ganho_mensal_brl]", (preco * this.dados[id][i]).toFixed(2));
                        break;
                    case "sacado":
                        t = t.replace("[sacado]", (this.dados[id][i]).toFixed(5));
                        t = t.replace("[sacado_brl]", tpl.dados[id]["sacado_brl"]);
                        break;
                    case "disponivel":
                        t = t.replace("[disponivel]", (tpl.dados[id]["recebido"]+tpl.dados[id]["ganho_mensal"]-tpl.dados[id]["sacado"]).toFixed(5));
                        t = t.replace("[disponivel_brl]", ((preco * (tpl.dados[id]["recebido"]+tpl.dados[id]["ganho_mensal"]-tpl.dados[id]["sacado"]))).toFixed(2));
                        break;
                    case "placas": 
                        var lista = '<span class="m-widget11__sub m--font-success" style="white-space: nowrap">' + this.dados[id][i].join('</span><span class="m-widget11__sub m--font-success" style="white-space: nowrap">') + '</span>'
                        t = t.replace("[" + i + "]", lista);
                        t = t.replace("[total_gpus]", this.dados[id][i].length);
                        break;
                    default:
                        t = t.replace("[" + i + "]", this.dados[id][i]);
                }
            }
            //console.log(t);
        }
        return t;
    }
};

tpl.mainId = "tbody-ganhos";
tpl.template = document.getElementById("ganhos-template").innerHTML;

function dados() {
    return {
        id: "",
        nome: "",
        participacao: 0,
        porcentagem: 0,
        placas: [],
        mhs: 0,
        energia: 0,
        ganho_mensal: 0,
        recebido: 0,
        progresso: 0,
        sacado: 0,
        sacado_brl: 0,
        disponivel: 0,
        html: ""
    };
}
