$(function() {
    var termListNames = ["Peter", "Pecius", "Karl", "Patrick", "Leonardo", "Mark"];

    $('#dummy, .test').inlineComplete();
    $('#blah').inlineComplete({
      list: termListNames
    })

});
