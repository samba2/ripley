
// added to global object since approrpiate extension of "Object" was
// difficult since all prototyped functions would need to be set
// to Object.defineProperty(...enumerable: false)
global.isEmptyObject = function(object) {
    for(var key in object) {
        if (object.hasOwnProperty(key)) {

            return false;
        }
    }
    return true;
}

