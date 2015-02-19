function ActiveTab(){
    this.activeTab;
}

ActiveTab.prototype.setActiveTab = function(newActiveTab) {
    this.activeTab = newActiveTab;
}

ActiveTab.prototype.getActiveTab = function() {
    return this.activeTab;
}

