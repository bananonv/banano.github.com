var network
var data = {}
data.nodes = new vis.DataSet()
data.edges = new vis.DataSet()

var my_addr = "ban_3idmghq44q6ucuj1fd8kdzmuun3w8ftsbnxnznx3gundti1ampd4reujfdgo"
var monkeys = true
var repSize = 60

async function message_handler(message) {
    if (!network) {
        createNetwork()
    }
    
    const rep = message.block.representative
    const sender = message.account
    const receiver = message.block.link_as_account
    var amount = raw_to_banano(message.amount)

    if (!data.nodes.get(rep)) {
        node = {
            id: rep,
            size: repSize,
            label: rep.slice(0, 8) +"..."+ rep.slice(60),
            font: {
                color: '#FFFFFF',
                size: 20
            }
        }
        data.nodes.add(node)
        getMonkeyAndUpdateNode(node)
    }

    node = data.nodes.get(sender)
    if (!node) {
        node = {
            id: sender,
            size: getSizeFromAmount(amount)
        }

        if (node.id == my_addr) {
            node.label = "@GmbLucas"
            node.font = {
                color: 'lime',
                size: 18
            }
        }

        data.nodes.add(node)
        getMonkeyAndUpdateNode(node)
    }
    if (sender != rep) {
        var existing = data.edges.get({
            filter: function (item) {
              return (item.from == sender && item.to == rep);
            }
        });

        if (existing.length == 0) {
            data.edges.add({
                from: sender,
                to: rep,
                color: {
                    color: 'red'
                }
            })
        }
    }
    
    node = data.nodes.get(receiver)
    if (!node) {
        node = {
            id: receiver,
            size: getSizeFromAmount(amount)
        }
        data.nodes.add(node)
        getMonkeyAndUpdateNode(node)
    }
    if (receiver != rep) {
        var existing = data.edges.get({
            filter: function (item) {
              return (item.from == rep && item.to == receiver);
            }
        });
        if (existing.length == 0) {
            data.edges.add({
                from: rep,
                to: receiver,
                color: {
                    color: 'green'
                }
            })
        }
    }

    if (receiver == my_addr) {
        node = data.nodes.get(sender)
        node.label = "DONATOR !"
        node.font = {
            size: 25,
            color: 'lime'
        }
        data.nodes.update(node)
    }
}

function new_websocket(url, ready_callback, message_callback) {
    let socket = new WebSocket(url);
    socket.onopen = function() {
        console.log('WebSocket is now open');
        if (ready_callback !== undefined) ready_callback(this);
    }
    socket.onerror = function(e) {
        console.error('WebSocket error');
        console.error(e);
        setTimeout(() => { subscribe() }, 2000);
    }
    socket.onmessage = function(response) {
        if (message_callback !== undefined && document.getElementById("socket").innerHTML == "Pause") 
            message_callback(response);
    }

    return socket;
}

function subscribe() {
    new_websocket('ws://152.228.141.68:7074', function(socket) {
        // onopen
        let params = {
            action: 'subscribe',
            topic: 'confirmation',
            ack: true
        }
        socket.send(JSON.stringify(params));
        }, function(response) {
        // onmessage
        let data = JSON.parse(response.data);
        if (data.topic != 'confirmation') return;
        let message = data.message;
        message_handler(message);
    });
}

function createNetwork() {
    var container = document.getElementById('container');
    var options = {
        physics: {
            timestep: 0.2,
            adaptiveTimestep: true,
            stabilization: {
                enabled: false
            }
        }
    };
    network = new vis.Network(container, data, options);
    network.on("selectNode",function(params) {
        window.open('https://mynano.ninja/account/'+params.nodes[0], '_blank');
    });
}

async function getMonkeyAndUpdateNode(node) {
    if (!monkeys && node.size != repSize) 
        return
    const response = await fetch("https://monkey.banano.cc/api/v1/monkey/"+node.id)
    const resp = await response.text()
    const img = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(resp)
    node.shape = 'image'
    node.image = img
    data.nodes.update(node)
}

function raw_to_banano(raw) {
	return NanoCurrency.convert(raw, {
        from: 'raw',
        to: 'Nano',
    });
}

function getSizeFromAmount(amount) {
    if (amount < 25) 
        return 25
    return Math.log10(amount) * 25
}

function socketToggle() {
    btn = document.getElementById("socket")
    if (btn.innerHTML == "Pause") {
        btn.innerHTML = "Resume"
    } else {
        btn.innerHTML = "Pause"
    }
}

function monkeysToggle() {
    btn = document.getElementById("monkeys")
    if (btn.innerHTML == "MonKeys enabled") {
        btn.innerHTML = "MonKeys disabled"
        monkeys = false
    } else {
        btn.innerHTML = "MonKeys enabled"
        monkeys = true
    }
}

subscribe()