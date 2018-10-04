const server = {};
const serverLib = {};
const config = 
{
    execPath: "/srvsyn/exec",
    initPath: "/srvsyn/init"
};

serverLib.authToken = null;
serverLib.authTokenKey = "srvsyn_authToken";
serverLib.request = function(path, data)
{
    var request = new XMLHttpRequest();
    request.open('POST', path, false);
    
    request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    var bodyText = "";
    if (data)
    {
        bodyText = JSON.stringify(data);
    }

    request.send(bodyText);

    if (request.status === 200)
    {
        return JSON.parse(request.responseText);
    }
}
serverLib.requestExecute = function(name, args)
{
    var execData = this.request(config.execPath, 
    {
        authToken: this.getAuthToken(), 
        functionArgs: args, 
        functionName: name 
    });

    console.log(execData);

    if (execData.authToken)
    {
        this.setAuthToken(execData.authToken);
    }
    if (execData.functionNames)
    {
        this.initServer(execData.functionNames);
    }
    if (execData.error)
    {
        console.error(execData.error);
    }

    return execData.result;
}
serverLib.getAuthToken = function()
{
    if (this.authToken)
    {
        return this.authToken;
    }
    else
    {
        return localStorage.getItem(this.authTokenKey);
    }
}
serverLib.setAuthToken = function(authToken)
{
    this.authToken = authToken;
    localStorage.setItem(this.authTokenKey, authToken);
}
serverLib.initServer = function(functionNames)
{
    for (const name of functionNames) {
        server[name] = function()
        {
            return serverLib.requestExecute(name, Object.values(arguments));
        }
    }
}
serverLib.initialize = function()
{
    this.authToken = this.getAuthToken();
    
    var initData = this.request(config.initPath, { authToken: this.authToken });

    console.log(initData);
    if (initData.functionNames)
    {
        this.initServer(initData.functionNames);
    }
}

serverLib.initialize();