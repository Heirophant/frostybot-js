const frostybot_module = require('./mod.base')
var context = require('express-http-context');

module.exports = class frostybot_gui_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Enable GUI

    async enable(params) {
        var ip = context.get('srcIp');
        if (['127.0.0.1','::1'].includes(ip)) {
            var schema = {
                email: {
                    required: 'string',
                },
                password: {
                    required: 'string'
                }
            }
    
            if (!(params = this.utils.validator(params, schema))) return false; 
    
            var [email, password] = this.utils.extract_props(params, ['email', 'password']);

            if (await this.user.core(email, password)) {
                if (await this.settings.set('core','gui:enabled', true)) {
                    return this.output.success('gui_enable');
                }
            }
            return this.output.error('gui_enable');
        }
        return this.output.error('local_only');
    }

    // Disable GUI

    async disable(params = null) {
        var ip = context.get('srcIp');
        if (['127.0.0.1','::1'].includes(ip)) {
            if (await this.settings.set('core','gui:enabled', false)) {
                return this.output.success('gui_disable');
            }
            return this.output.error('gui_disable');
        }
        return this.output.error('local_only');
    }

    // Check if GUI is enabled

    async gui_is_enabled() {
        var enabled = await this.settings.get('core', 'gui:enabled', false);
        if (String(enabled) == "true")
            return true;
        else
            return false;
    }

    // Check if multi-user is enabled

    async multiuser_is_enabled() {
        var enabled = await this.settings.get('core', 'multiuser:enabled', false);
        if (String(enabled) == "true")
            return true;
        else
            return false;
    }

    // Extract request and response parameters

    extract_request(params) {
        if (params.hasOwnProperty('_raw_'))
            var raw = params['_raw_'];
        else
            var raw = { res: null, req: null};
        return [raw.res, raw.req];
    }

    // Load Main GUI Page

    async main(params) {
        var [res, req] = this.extract_request(params);
        if (!(await this.gui_is_enabled()))
            return this.render_error(res, 'GUI is not enabled.');
        return this.render_page(res, "pages/main", { pageTitle: 'Configuration' });
        //} else {
        //    return this.render_page(res, "pages/main", { pageTitle: 'Configuration', uuid: uuid });
        //} 
    }

    // Load Login Page

    async login(params) {
        var [res, req] = this.extract_request(params);
        if (!(await this.gui_is_enabled()))
            return this.render_error(res, 'GUI is not enabled.');
        var regsuccess = params.hasOwnProperty('regsuccess') ? params.regsuccess : false;
        var sessiontimeout = params.hasOwnProperty('sessiontimeout') ? params.sessiontimeout : false;
        /*
        var auth = await this.get_auth_config();
        if (auth !== false) {
            const oauth2Client = new OAuth2(auth.clientid, auth.secret, auth.url + '/ui/auth_callback');    
            const loginLink = oauth2Client.generateAuthUrl({
                access_type: 'offline', 
                scope: [
                    'https://www.googleapis.com/auth/plus.me', 
                    'https://www.googleapis.com/auth/userinfo.email',              
                ]
            });
            return this.render_page(res, "pages/login", { pageTitle: 'Login', loginLink: loginLink });
        }
        return res.send(auth);        
        */
        var multiuser = await this.settings.get('core','multiuser:enabled');
        return this.render_page(res, "pages/login", { pageTitle: 'Login', regsuccess: regsuccess, sessiontimeout: sessiontimeout, showregister: (multiuser ? true: false) });
    }

    // Register User

    async register(params) {
        var [res, req] = this.extract_request(params);
        if (!(await this.multiuser_is_enabled()))
            return this.render_error(res, 'Cannot register more users. Multi-user mode is not enabled.');
        if (!(await this.gui_is_enabled()))
            return this.render_error(res, 'GUI is not enabled.');
        return this.render_page(res, "pages/register", { pageTitle: 'Register' });
    }

    // Get Content

    async content(params) {
        var [res, req] = this.extract_request(params);
        if (!(await this.gui_is_enabled()))
            return this.render_error(res, 'GUI is not enabled.');
        var params = {...req.params, ...req.query};
        var token = params.hasOwnProperty('token') ? params.token : false;
        var uuid = token != false ? token.uuid : false;
        if (uuid == false) {
            return res.send({'error' : 'invalid_uuid'});
        } else {
            context.set('uuid', uuid);
            if (params.hasOwnProperty('key')) {
                var key = params.key;
                var data = { uuid : uuid };
                switch (key) {
                    case 'table_apikeys'    :   var accounts = await this.accounts.get();
                                                data[key] = accounts;
                                                break;
                }
                var template = key.split('_').join('.');
                return this.render_page(res, "partials/" + template + ".ejs", data);   
            } else {
                return res.send({'error' : 'invalid_key'});
            }
        }
    }

    // Render Page

    render_page(res, template, vars) {
        if (!vars.hasOwnProperty('uuid'))
            vars['uuid'] = '';
        return res.render(template, vars);
    }


    // Render Error

    render_error(res, message) {
        return res.render("pages/error", { pageTitle: 'Error', errorMsg: message });
    }



}