'use strict';

var UserObject = Parse.Object.extend('User');

Parse.Cloud.define('saveUser', function (request, response) {
    (new UserObject()).save(request.params.user, {useMasterKey: true}).then(function (user) {
        response.success(user);
    }).catch(function (error) {
        response.error(error);
    });
});

Parse.Cloud.define('deleteUser', function (request, response) {
    var query = new Parse.Query(Parse.User);
    query.get(request.params.usuarioId, {useMasterKey: true}).then(function (user) {
        user.destroy({useMasterKey: true}).then(function () {
            response.success('destroyed');
        }).catch(function (error) {
            response.error(error);
        });
    }).catch(function (error) {
        response.error(error);
    });
});
