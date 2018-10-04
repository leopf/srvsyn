# How it works

As a web developer you often find yourself writing APIs for your client. Extracting the data, managing accesslevels and executing the code you want can challenge the structure of your program. This means you losing time. When you use **srvsyn**, you can execute functions on your server as if they were executed on your client. Just call the function and wait for the response.

# Installation

```
$ npm install srvsyn
```

# Sample

## Server

The setup is simple and straight forward. Set up an express server, define your functions and initialize. 

The initialization function has three parameters:
* express app - the application, on which srvsyn is running.
* external authentication function (not required) - a function to return an authentication level, when the sent authentication token is unknown. This can be used to look for the authentication token in a database.
* config (not required) - Consists of two properties (execPath, initPath), which can be set if the default srvsyn urls conflict with others.

```js
var express = require('express');
var server = require('./srvsyn');

var app = express();
app.use("/", express.static(__dirname + "/src"))

server.access[0].helloWorld = function(name)
{
    return "Hello world from " + name + "!";
}

server.access[0].login = function()
{
    this.authenticate(1);
}

server.access[1].secureHelloWorld = function(name)
{
    return "Secure hello world from " + name + "!";
}

server.initialize(app, function(token) 
{
    return 0;
});

app.listen(80);

```

## Client

Include the client library:

```html
<html>
    <head>
        ...
        <script src="client.srvsyn.js"></script>
        ...
    </head>
    ...
<html>
```

Any initialization is done automatically. You can now use the functions you defined on your server.
By default the accesslevel is 0. Before the client can use the function **secureHelloWorld** it must have at least an accesslevel of 1.

*A client does not know that a function exists, when it is not authenticated to use it. When used anyways, it will not find the function.*

Any JavaScript on the client:

```js
console.log(server.helloWorld('hurray')); //Expected output: Hello world from hurray!
server.login();
console.log(server.secureHelloWorld('hurray')); //Expected output: Secure hello world from hurray!
```