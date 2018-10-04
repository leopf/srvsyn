const crypto = require('crypto'); 
const bodyParser = require('body-parser');

const defaultConfig =
{
    execPath: "/srvsyn/exec",
    initPath: "/srvsyn/init"
};
const authentication = [ ];
const access =     
[
    {}, // 0
    {}, // 1
    {}, // 2
    {}, // 3
    {}, // 4
    {}, // 5
    {}, // 6
    {}, // 7
    {}, // 8
    {}, // 9
];

var accessFunctions = { };
var externAuth = null;

function checkConfig(config)
{
    return {
        execPath: (config.execPath || defaultConfig.execPath), 
        initPath: (config.initPath || defaultConfig.initPath)
    };
}
function initAccess()
{
    accessFunctions = { };

    for (var i = 0; i < 10; i++)
    {
        for (var f in access[i]) 
        {
            accessFunctions[f] = 
            {
                accessLevel: i,
                execute: access[i][f]
            };
        }
    }
}
function initialize(app, eAuth, config = defaultConfig)
{
    var config = checkConfig(config);

    app.use(bodyParser.json());

    app.post(config.execPath, function(req, res) 
    {
        var context = new RequestContext(req.body.authToken);
        context.execute(req.body.functionName, req.body.functionArgs);

        var response = 
        {
            result: context.result,
            error: context.error
        };

        if (req.body.authToken != context.authToken)
        {
            response.authToken = context.authToken;
            response.functionNames = listFunctions(getAccessLevel(req.body.authToken), context.accessLevel);
        }

        res.json(response);
    });
    app.post(config.initPath, function(req, res) 
    {
        res.json({
            functionNames: listFunctions(-1, getAccessLevel(req.body.authToken))
        });
    });

    externAuth = eAuth;

    initAccess();
}
function getAccessLevel(authToken)
{
    if (authToken)
    {
        for (const auth of authentication) 
        {
            if (auth.authToken == authToken)
            {
                return auth.accessLevel;
            }
        }

        if (externAuth)
        {
            var eAccessLevel = externAuth(authToken);

            if (eAccessLevel != null)
            {
                authentication.push({
                    authToken: authToken,
                    accessLevel: eAccessLevel
                });
            }

            return eAccessLevel || 0;
        }
    }

    return 0;
}
function listFunctions(startLevel, endLevel)
{
    var list = [];
    for (var name in accessFunctions) {
        var aL = accessFunctions[name].accessLevel;
        if (aL > startLevel && aL <= endLevel)
        {
            list.push(name);
        }
    }
    return list;
}

function RequestContext(authToken)
{
    this.authToken = authToken;
    this.result = null;
    this.accessLevel = getAccessLevel(authToken);
    this.error = null;

    this.authenticate = function(aL)
    {
        this.authToken = crypto.randomBytes(32).toString('hex');

        authentication.push({
            authToken: this.authToken,
            accessLevel: aL
        });

        this.accessLevel = aL;
    }
    this.hasAccess = function(aL)
    {
        return this.accessLevel >= aL;
    }
    this.execute = function(name, args)
    {
        if (accessFunctions[name] && this.hasAccess(accessFunctions[name].accessLevel))
        {
            try 
            {
                var result = accessFunctions[name].execute.apply(this, args);
                if (result)
                {
                    this.result = result;
                }
            } 
            catch (error) 
            {
                this.error = "There was a problem executing the function.";
            }
        }
        else
        {
            this.error = "This function is either not definied or not available at this access Level!";
        }
    }
}


module.exports.initAccess = initAccess;
module.exports.initialize = initialize;
module.exports.access = access;