var Globals = {
    canvas: document.getElementById("c"),
    context: document.getElementById("c").getContext('2d'),
    debug: function(title) {
        console.log(title, arguments);
    },
    showNumbers: false
};

