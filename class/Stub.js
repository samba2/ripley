/*
 * Example module
 * 
 */
function Stub(data) {
    this.data = data;
};

Stub.prototype.toString = function() {
    console.log(this.data.toString());
}

// node.js module export
module.exports = Stub;
