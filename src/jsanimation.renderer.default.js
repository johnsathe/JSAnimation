(function (par) {
    "use strict";
    /* File Created: March 23, 2012 Manish Sathe*/
    var JSAnimation = null;
    if (par.JSAnimation) {
        JSAnimation = window.JSAnimation;
    } else {
        JSAnimation = {};
    }
    if (par.JSAnimation.Renderer) {
    } else {
        window.JSAnimation.Renderer = {};
        JSAnimation.Renderer = {};
    }
    JSAnimation.Renderer.Default = function (Stage) {
        this.Stage = Stage;
        this.Init();
        return this;
    };
    JSAnimation.Renderer.Default.prototype = {
        toString: function () { return "JSAnimation.Renderer.Default"; },
        Stage: null,
        Init: function () {

        },
        MakeUnDRaggable: function (obj) {
            try {
                obj.attr("draggable", "false");
            } catch (ignore) { }
            try {
                obj.bind("dragstart", function (e) {
                    if (e.target.nodeName.toUpperCase() === "IMG") {
                        return false;
                    }
                });
            } catch (ignore) { }
        },
        RenderGraphic: function (Actor) {
            var str = "";
            str += "<div ";
            if (Actor.AltText !== null) {
                str += " title='" + Actor.AltText + "'";
                str += " alt='" + Actor.AltText + "'";
            }
            str += " unselectable='on' style='-moz-user-select: -moz-none;-khtml-user-select: none;-webkit-user-select: none;user-select: none;' draggable='false' id='" + Actor.ID + "'></div>";
            this.Stage.append(str);
            this.MakeUnDRaggable($("#" + Actor.ID));
        },
        RenderImage: function (Actor) {
            var str = "";
            if (Actor.ImageType === "Sprite") {
                str += "<div";
                if (Actor.AltText !== null) {
                    str += " title='" + Actor.AltText + "'";
                    str += " alt='" + Actor.AltText + "'";
                }
                str += " role='contentinfo' unselectable='on' style='-moz-user-select: -moz-none;-khtml-user-select: none;-webkit-user-select: none;user-select: none;' draggable='false' id='" + Actor.ID + "'></div>";
                this.Stage.append(str);
            } else {
                str += "<div ";
                if (Actor.AltText !== null) {
                }
                str += " unselectable='on' style='-moz-user-select: -moz-none;-khtml-user-select: none;-webkit-user-select: none;user-select: none;' draggable='false' id='" + Actor.ID + "'><img";
                if (Actor.AltText !== null) {
                    str += " title='" + Actor.AltText + "'";
                    str += " alt='" + Actor.AltText + "'";
                }
                str += " draggable='false' src='' width='100%' height='100%' /></div>";
                this.Stage.append(str);
            }
            this.MakeUnDRaggable($("#" + Actor.ID));
        }
    };
}(window));