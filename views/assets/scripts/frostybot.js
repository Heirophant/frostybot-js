$( document ).ready(function() {

    // ---------------------------------------------------------
    //   Show Toast Message
    // ---------------------------------------------------------

    var showToast = function(message, color, time=2000) {
        $.toast({ 
            text : message, 
            showHideTransition : 'slide',   // It can be plain, fade or slide
            bgColor : color,                // Background color for toast
            textColor : '#eee',             // text color
            allowToastClose : true,         // Show the close button or not
            hideAfter : time,               // `false` to make it sticky or time in miliseconds to hide after
            stack : 2,                      // `false` to show one stack at a time count showing the number of toasts that can be shown at once
            textAlign : 'left',             // Alignment of text i.e. left, right, center
            position : 'bottom-right'       // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values to position the toast on page
        });                
    }

    // Show success toast message
    var showSuccess = function(message, time=2000) {
        showToast('SUCCESS: ' + message,'green',time);
    }

    // Show notice toast message
    var showNotice = function(message, time=2000) {
        showToast('NOTICE: ' + message,'blue',time);
    }

    // Show error toast message
    var showError = function(message, time=2000) {
        showToast('ERROR: ' + message,'red',time);
    }

    // ---------------------------------------------------------
    //   AJAX Loading Icon
    // ---------------------------------------------------------

    $(document).ajaxStart(function() {
        $(".loading").show();
    });

    $(document).ajaxStop(function() {
        $(".loading").hide();
    });

    $(".loading").hide();

    // ---------------------------------------------------------
    //   Form field validators
    // ---------------------------------------------------------

    function validateEmail(mail) {
        if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail)) {
            return true
        }
        return false
    }

    // ---------------------------------------------------------
    //   API
    // ---------------------------------------------------------

    function api(command, params, callback) {
        params['command'] = command;
        var token = getToken();
        if (token != null) {
            params['token'] = token;
        }
        $.post( "/frostybot", params)
            .done(function( json ) {
                callback(json);
            })
            .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
            });
    }

    function loadPage(key) {
        document.location.href = key;
    }

    function updateContent(key, params = {}, callback = null) {
        var token = getToken();
        if (token != null) {
            params['token'] = token;
        }
        $.get( "/ui/content/" + key, params)
        .done(function( html ) {
            $('#'+key).html( html);
            if (callback != null)
                callback();
        })
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
        });
    }

    // ---------------------------------------------------------
    //   Session Management
    // ---------------------------------------------------------


    function checkTokenValidity() {
        if (localStorage) {
            var token = localStorage.getItem("token");
            if (token != null) {
                var token = JSON.parse(token);
                if (token != null && token.hasOwnProperty('expiry')) {
                    var expiry = token.expiry;
                    var ts = (new Date()).getTime();
                    if (ts > expiry) {
                        localStorage.setItem("token", null);
                        loadPage('/ui/login?sessiontimeout=true');
                    }
                }
            }
        }
    }

    setInterval(checkTokenValidity, 1000);

    function getUUID() {
        if (localStorage) {
            var token = localStorage.getItem("token");
            if (token != null) {
                var token = JSON.parse(token);
                if (token != null && token.hasOwnProperty('uuid')) {
                    var uuid = token.uuid;
                   return uuid;
                }
            }
        }
        return null;
    }

    function getToken() {
        if (localStorage) {
            var token = localStorage.getItem("token");
            if (token != null) {
                var token = JSON.parse(token);
                if (token != null) {
                   return token;
                }
            }
        }
        return null;
    }

    function updateHeaderUUID() {
        if (localStorage) {
            var token = localStorage.getItem("token");
            if (token != null) {
                var token = JSON.parse(token);
                if (token != null && token.hasOwnProperty('uuid')) {
                    var uuid = token.uuid;
                    $('#header_uuid').html('<b>UUID:</b> ' + uuid);
                }
            }
        }
    }
    
    updateHeaderUUID();

    $('#tabs-logout-tab').on('click', function() {
        if (localStorage) 
            localStorage.setItem("token", null);
        loadPage('/ui/login');
    });

    // ---------------------------------------------------------
    //  User Registration
    // ---------------------------------------------------------

    function submitRegistrationForm() {
        var email = $("#inputemail").val();
        var password = $("#inputpassword").val();
        var confirm = $("#inputconfirm").val();
        if (!validateEmail(email)) {
            showError('Invalid email address');
            return false;
        }
        if (password != confirm) {
            showError('Password and confirm password do not match');
            return false;
        }
        var data = {
            email: email,
            password: password
        }
        api('user:register', data, function(json) {
            if (json.result == "success") {
                loadPage('/ui/login?regsuccess=true');
            } else {
                showError("Failed to register user.", 5000)
            }
        });

    }    

    $("#registerform").submit(function(event){
        event.preventDefault();
        submitRegistrationForm();
    });

    // ---------------------------------------------------------
    //  User Login
    // ---------------------------------------------------------

    function submitLoginForm() {
        var email = $("#inputemail").val();
        var password = $("#inputpassword").val();
        if (!validateEmail(email)) {
            showError('Invalid email address');
            return false;
        }
        var data = {
            email: email,
            password: password
        }
        api('user:login', data, function(json) {
            if (json.result == "success") {
                var token = json.data;
                if(localStorage)
                    localStorage.setItem("token", JSON.stringify(token));
                loadPage('/ui');
            } else {
                showError("Login failed. Please check your credentials and try again.", 5000)
            }
        });

    }    

    $("#loginform").submit(function(event){
        event.preventDefault();
        submitLoginForm();
    });


    // ---------------------------------------------------------
    //   API Key Management
    // ---------------------------------------------------------


    function submitApiKeysForm() {
        var ex = $("#inputexchange").val();
        var [exchange, type] = ex.split('_');
        var data = {
            uuid: getUUID(),
            stub: $("#inputstub").val(),
            exchange: exchange,
            testnet: exchange == 'ftx' ? false : $("#inputtestnet").is(":checked"),
            apikey: $("#inputapikey").val(),
            secret: $("#inputsecret").val(),
            description: $("#inputdescription").val(),
        }
        var subaccount = $("#inputsubaccount").val();
        if ((exchange == 'ftx') && (subaccount != ''))
            data['subaccount'] = subaccount; 
        if (type != undefined) data['type'] = type;
        api('accounts:add', data, function(json) {
            if (json.result == "success") {
                showSuccess("Successfully added API key", 5000);
                hideApiKeyForm();
                showApiKeyTable();
                refreshApiKeyTable();
            } else {
                showError("Failed to add account, please check the API key and secret and try again.", 5000)
            }
        });
    }

    $("#apikeysform").submit(function(event){
        event.preventDefault();
        submitApiKeysForm();
    });

    function updateApiKeyFormFields() {
        var val = $( "#inputexchange" ).val();
        if (val == 'ftx') {
            $( "#subaccountfield" ).show();
            $( "#testnetfield" ).hide();
        } else {
            $( "#subaccountfield" ).hide();
            $( "#testnetfield" ).show();
        }
    }

    function setApiKeyTitle(title) {
        $( "#apikeystitle" ).html(title);
    }

    function hideApiKeyTableButtons() {
        $( "#apikeysnavbar" ).hide();
    }

    function showApiKeyTableButtons() {
        $( "#apikeysnavbar" ).show();
    }

    function hideApiKeyForm() {
        $( "#form_apikeys" ).hide();
    }

    function showApiKeyForm(stub = null) {
        if (stub != null) {
            api('accounts:get', {stub: stub}, function(json) {
                if (json.result == "success") {
                    var account = Object.values(json.data)[0];
                    $('#inputstub').val(account.stub);
                    $('#inputexchange').val(account.exchange + (account.hasOwnProperty('type') ? '_' + account.type : ''));
                    $('#inputapikey').val(account.parameters.apikey);
                    $('#inputsecret').val('');
                    $("#inputsecret").attr("placeholder", "For security reasons, you must re-enter your secret to edit this stub");
                    $('#inputtestnet').prop( "checked", account.parameters.testnet == "true" ? true : false);
                    $('#inputdescription').val(account.description);
                    $('#inputsubaccount').val(account.parameters.subaccount);
                    updateApiKeyFormFields();
                    setApiKeyTitle('Configure API Key');
                    $( "#form_apikeys" ).show();
                } else {
                    showError('Failed to load account details');
                }
            });
        } else {
            $('#inputstub').val('');
            $('#inputexchange').val('');
            $('#inputapikey').val('');
            $('#inputsecret').val('');
            $("#inputsecret").attr("placeholder", "");
            $('#inputtestnet').prop( "checked", false);
            $('#inputdescription').val('');
            updateApiKeyFormFields();
            setApiKeyTitle('Configure API Key');
            $( "#form_apikeys" ).show();
        }
        $( "inputstub" ).focus();
    }

    function hideApiKeyTable() {
        hideApiKeyTableButtons();
        $( "#table_apikeys" ).hide();
    }

    function showApiKeyTable() {
        setApiKeyTitle('API Keys');
        showApiKeyTableButtons()
        $( "#table_apikeys" ).show();
    }

    function testApiKey(stub) {
        api('accounts:test', { stub: stub}, function(json) {
            if (json.result == "success") {
                showSuccess('API Key tested successfully');
            } else {
                showFail('API Key test failed')
            }
        });
    }

    function deleteApiKey(stub) {
        api('accounts:delete', { stub: stub}, function(json) {
            if (json.result == "success") {
                showSuccess('API Key deleted successfully');
                refreshApiKeyTable();
            } else {
                showFail('Failed to delete API key')
            }
        });    
    }

    function refreshApiKeyTable() {
        updateContent('table_apikeys', {}, function() {
            $( ".testapikeylink" ).on( "click", function() {
                var stub = $(this).attr('data-stub');
                testApiKey(stub);
            });
            $( ".editapikeylink" ).on( "click", function() {
                var stub = $(this).attr('data-stub');
                showApiKeyForm(stub);
                hideApiKeyTable();
            });
            $( ".deleteapikeylink" ).on( "click", function() {
                if (confirm("Are you sure you wish to delete this API key?")) {
                    var stub = $(this).attr('data-stub');
                    deleteApiKey(stub);
                }
            });
        });
    }

    refreshApiKeyTable();
    hideApiKeyForm();
    showApiKeyTable();
    updateApiKeyFormFields();

    $( "#inputexchange" ).on( "change", function() {
        updateApiKeyFormFields();
    });

    $( "#apiformcancel" ).on( "click", function() {
        hideApiKeyForm();
        showApiKeyTable();
    });

    $( "#addapikeylink" ).on( "click", function() {
        showApiKeyForm();
        hideApiKeyTable();
    });
    
    $( "#apikeyrefreshlink" ).on( "click", function() {
        hideApiKeyForm();
        showApiKeyTable();
        refreshApiKeyTable();
    });

    
});