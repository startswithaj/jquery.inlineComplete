$(function() {
    var termListNames = ["Peter", "Pecius", "Karl", "Patrick", "Leonardo", "Mark"];

    $('#dummy, .test').inlineComplete();
    $('#blah').inlineComplete({
      list: termListNames
    })
    // You can then update the list later on and set it again
    termListNames.push("blah blah blah")
    termListNames.push("blahblahblah.com")
    $('#blah').inlineComplete({
      list: termListNames // will now include blah blah etc
    })

});
