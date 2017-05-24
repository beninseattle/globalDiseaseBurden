function gdbMain() {
    var DictFiles = ['ages', 'genders', 'locations', 'metrics'];
    var Data = {};

    $.when(
        $.getJSON(DictFiles[0] + '.json', function (data) {
            Data[DictFiles[0]] = data;
        }),
        $.getJSON(DictFiles[1] + '.json', function (data) {
            Data[DictFiles[1]] = data;
        }),
        $.getJSON(DictFiles[2] + '.json', function (data) {
            Data[DictFiles[2]] = data;
        }),
        $.getJSON(DictFiles[3] + '.json', function (data) {
            Data[DictFiles[3]] = data;
        })
    )
        .done(function (a1, a2, a3, a4) {
            console.log('Data loaded: ', Data);
        })
        .fail(function (error) {
                console.log('something failed: ', error);
            }
        )
    ;


    console.log('test...');
    var d1 = $.Deferred();
    var d2 = $.Deferred();
    var d3 = $.Deferred();

    $.when(d1, d2, d3)
        .done(function (v1, v2, v3) {
            console.log(v1); // v1 is undefined
            console.log(v2); // v2 is "abc"
            console.log(v3); // v3 is an array [ 1, 2, 3, 4, 5 ]
        })
        .fail(function (error) {
            console.log('error! ' + error);
        });

    console.log('resolve 1');
    d1.resolve();
    console.log('resolve 2');
    d2.resolve("abc");
    console.log('resolve 3');
    d3.reject('omg');
    //d3.resolve(1, 2, 3, 4, 5);
}

$(document).ready(gdbMain);