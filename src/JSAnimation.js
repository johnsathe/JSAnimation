(function (par) {
    "use strict";
    /**
    * JSAnimation Framework
    * @author Manish Sathe
    * @version 2.4
    * @namespace JSAnimation
    */
    var JSAnimation = {};
    par.JSAnimation = JSAnimation;
    /**
    * JsAnimation animation class
    * @class
    * @constructor
    * @param {string} id - ID for the DIV element
    */
    JSAnimation.Animation = function (id) {
        this.ID = id;
        this.Stage = $("#" + id);
        this.Renderer = new JSAnimation.Renderer.Default(this.Stage);
        this.Events = new JSAnimation.Events.Animation();
        this.State = new JSAnimation.State.Animation();
        this.CurrentAnimatedObj = new JSAnimation.JQAnimation.Animation();
        this.Actors = [];
        this.Actions = [];
        this._currentJSAnimation = [];
        this.JumpTill=null;
        this._currentSEQAnims = [];
        this.ActorsAddress = {};
        return this;
    };
    JSAnimation.Animation.prototype = {
        /**
        * ID of the animation instance
        * @type {string}
        */
        ID: null,
        UseBase64: false,
        JumpTill:null,
        Base64Imgs: {},
        /**
        * Define wether the animation will replay on finish, defualt 'false'
        * @type {boolean}
        */
        PlayOnce: false,
        Jump: false,
        Stage: null,
        /**
        * Sped of animation in miliseconds
        * @type {number}
        */
        Speed: 500,
        /**
        * Current frame of animation
        * @type {number}
        */
        CurrentFrame: 0,
        /**
        * Total frames in animation
        * @type {number}
        */
        TotalFrames: 100,
        Renderer: null,
        /**
        * Array of all actors in animation
        * @type {array}
        */
        Actors: [],
        /**
        * Array of all actions in animation
        * @type {array}
        */
        Actions: [],
        ActorsAddress: null,
        /**
        * Animation events
        * @type JSAnimation.Events.Animation
        */
        Events: null,
        toString: function () { return "JSAnimation.Animation (" + this.ID.toString() + ")"; },
        State: null,
        _currentSEQAnims: [],
        _currentJSAnimation: [],
        _timer: null,
        Parent: null,
        /**
        * Return actor object from ID
        * @param {string} ActorID - ID of the actor object
        * @return {JSAnimation.Actor}
        */
        GetActorByID: function (ActorID) {
            var act = this.Actors.length;
            // for (var act = 0; act < this.Actors.length; act++) {
            while (act--) {
                //console.log(this.Actors[act].ID + " = " + ActorID)
                if (this.Actors[act].ID === ActorID) {
                    return this.Actors[act];
                }
            }
        },
        /**
        * Get stage height
        * @return {number}
        */
        GetStageHeight: function () {
            var act = this.Actors.length, maxHeight;
            maxHeight = 0;
            while (act--) {
                if ((this.Actors[act].Y + parseInt(this.Actors[act].JqObject.outerHeight(), 10)) > maxHeight) {
                    maxHeight = this.Actors[act].Y + parseInt(this.Actors[act].JqObject.outerHeight(), 10);
                }
            }
            return maxHeight;
        },
        /**
        * Goto frame and play
        * @param {number} FrameNumber - frame number
        */
        GoToAndPlay: function (FrameNumber) {
            this.GoToFrame(FrameNumber);
            this.Play();
        },
        /**
        * Stop at a particular frame
        * @param {number} FrameNumbae - frame number
        */
        GoToAndStop: function (FrameNumber) {
            this.GoToFrame(FrameNumber);
            this.Stop();
        },
        /**
        * Goto frame 
        * @param {number} FrameNumber - frame number
        */
        GoToFrame: function (FrameNumber) {
            this.Jump = true;
            this.Reset();
            this.CurrentFrame = FrameNumber;
            var i, j = 0;
            for (i = 0; i <= FrameNumber; i++) {
                j = 0;
                for (j = 0; j < this.Actions.length; j++) {
                    if (this.Actions[j].StartFrame === i) {
                        this.JumpTill = FrameNumber;
                        this.RunActorAction(this.Actions[j], this);
                        this.JumpTill = null;
                    }
                }
            }
            this.Events.OnAnimationFrameChange();
        },
        /**
        * Add actor in animation
        * @param {JSAnimation.Actor} Actor - new actor
        */
        PlaceActors: function (Actor) {
            var nObj, DummyObj, RetObj;
            this.Actors.push(Actor);
            if (Actor.Type.toString().indexOf("JSAnimation.Animation") >= 0) {
                DummyObj = $.extend(true, {}, Actor.Type);
                DummyObj.Stage.clone().attr("id", Actor.ID).appendTo(this.Stage);
                DummyObj.ID = Actor.ID;
                DummyObj.Stage = $("#" + this.ID + " #" + Actor.ID);
                DummyObj.Reset();
                DummyObj.Parent = this;
                Actor.Type = DummyObj;
                nObj = DummyObj.Stage;
            } else if (Actor.Type === "ImageActor") {
                RetObj = null;
                if (Actor.ImageType === "Image") {
                    RetObj = new JSAnimation.Modules.SEQImageAnimation(this, Actor);
                    Actor.JqObject = $("#" + this.ID + " #" + Actor.ID);
                    Actor = RetObj.Actor;
                    nObj = RetObj.nObj;
                    this._currentSEQAnims.push(RetObj.retObj);
                }
                if (Actor.ImageType === "Sprite") {
                    RetObj = new JSAnimation.Modules.SEQSpriteAnimation(this, Actor);
                    Actor.JqObject = $("#" + this.ID + " #" + Actor.ID);
                    Actor = RetObj.Actor;
                    nObj = RetObj.nObj;
                    this._currentSEQAnims.push(RetObj.retObj);
                }
            } else {
                this.Renderer.RenderGraphic(Actor);
                nObj = $("#" + this.ID + " #" + Actor.ID);
                Actor.JqObject = nObj;
            }

            nObj.css({
                position: "absolute",
                top: Actor.Y,
                left: Actor.X,
                width: Actor.Width,
                height: Actor.Height
            });
            if (Actor.AltText !== null) {
                nObj.attr("title", Actor.AltText);
            }
            if (Actor.CSS) {
                nObj.addClass(Actor.CSS);
            }
            if (Actor.Text) {
                nObj.html(Actor.Text);
            }
            if ((typeof Actor.Visible) === "boolean") {
                if (Actor.Visible) {
                    nObj.show();
                } else {
                    nObj.hide();
                }
            }
            this.ActorsAddress["#" + this.ID + " #" + Actor.ID] = Actor;
        },
        /**
        * Add action in animation
        * @param {JSAnimation.Action} Action - new action object
        */
        AddAction: function (Action) {
            this.Actions.push(Action);
        },
        /**
        * Play the animation
        */
        Play: function () {
            if (this.State.isPlaying) { return;}
            this.Jump = false;
            this.State.Playing();
            this.Events.OnAnimationPlay(this);
            this.JQResume();
            this.CheckAnimState();
        },
        PlaySEQAnims: function () {
            var a2 = 0;
            for (a2 = 0; a2 < this._currentSEQAnims.length; a2++) {
                this._currentSEQAnims[a2]._runAction();
            }
        },
        /**
        * Stop the animation
        */
        Stop: function () {
            this.JQStop();
            this.ClipStop();
            this.State.Stoped();
            this.Events.OnAnimationStop(this);
            //console.log(this + " has stopped");
            clearTimeout(this._timer);
        },
        /**
        * Delete the animation
        */
        Delete: function () {
            this.State.Stoped();
            clearTimeout(this._timer);
            this.CurrentFrame = 0;
            this.Events.OnAnimationFrameChange(this);
            this.ActorsAddress = {};
            this._currentJSAnimation = [];
            var s = 0;
            for (s = 0; s < this._currentSEQAnims.length; s++) {
                this._currentSEQAnims[s].Stop();
            }
            this._currentSEQAnims = [];
            this.Stage.html("");
            this.Actors = [];
            this.Actions = [];
            //delete this;
        },
        /**
        * Reset/Rewind the animation
        */
        Reset: function () {
            this.State.Stoped();
            clearTimeout(this._timer);
            this.CurrentFrame = 0;
            this.JumpTill = null;
            this.Events.OnAnimationFrameChange(this);
            this.ActorsAddress = {};
            this._currentJSAnimation = [];
            this._currentSEQAnims = [];
            this.Stage.html("");
            var a1, actTemp, a2, actTemp2;
            actTemp = this.Actors;
            this.Actors = [];
            this.Stage.html("");
            for (a1 = 0; a1 < actTemp.length; a1++) {
                this.PlaceActors(actTemp[a1]);
            }
            actTemp2 = this.Actions;
            this.Actions = [];
            for (a2 = 0; a2 < actTemp2.length; a2++) {
                this.AddAction(actTemp2[a2]);
            }
        },
        /**
        * Replay the animation
        */
        Replay: function () {
            this.Reset();
            this.Play();
        },
        JQStop: function () {
            var CurrentAnimatedObj, ox;
            ox = this._currentJSAnimation.length;
            while (ox--) {
                CurrentAnimatedObj = this._currentJSAnimation[ox];
                if (CurrentAnimatedObj.TargetObject !== null) {
                    if (this.CurrentFrame >= CurrentAnimatedObj.StartFrame && this.CurrentFrame < CurrentAnimatedObj.EndFrame) {
                        CurrentAnimatedObj.TargetObject.stop();
                    }
                }
            }
        },
        JQResume: function () {
            var CurrentAnimatedObj, ox;
            ox = this._currentJSAnimation.length;
            while (ox--) {
                CurrentAnimatedObj = this._currentJSAnimation[ox];
                if (CurrentAnimatedObj.TargetObject !== null) {
                    if (this.CurrentFrame >= CurrentAnimatedObj.StartFrame && this.CurrentFrame < CurrentAnimatedObj.EndFrame) {
                        CurrentAnimatedObj.TargetObject.animate(CurrentAnimatedObj.EndCSS, CurrentAnimatedObj.Prop);
                    }
                }
            }
        },
        ClipStop: function () {
            /* empty block ... */
        },
        UpdateSpeed: function (NewSpeed) {
            this.Speed = NewSpeed;
        },
        CheckAnimState: function () {
            if ((this.CurrentFrame < this.TotalFrames) && this.State.isPlaying) {
                this.Events.OnAnimationFrameChange(this);
                var AnimObj = this;
                this._timer = setTimeout(function () { AnimObj.RunAction(AnimObj); }, this.Speed);
            } else {
                this.Stop();
                this.Events.OnAnimationEnd(this);
                if (this.PlayOnce === false) {
                    this.Replay();
                }

            }
        },
        RunAction: function (AnimObj) {
            AnimObj.CurrentFrame++;
            var j, k;
            j = AnimObj.Actions.length;
            k = 0;
            while (j--) {
                if (AnimObj.Actions[k].StartFrame === AnimObj.CurrentFrame) {
                    AnimObj.RunActorAction(AnimObj.Actions[k], AnimObj);
                }
                k++;
            }
            if (AnimObj.State.isPlaying) {
                AnimObj.CheckAnimState();
            }
        },
        RunActorAction: function (Action, AnimObj) {
            var targetObj, clipObj, dObj, easing, frms, dur, prop, JQAnimC, diff;
            dObj = AnimObj.ActorsAddress["#" + AnimObj.ID + " #" + Action.TargetID];
            if (dObj === undefined) {
                dObj = {};
                dObj.Type = "";
            }
            if (dObj.Type.toString().indexOf("JSAnimation.Animation") >= 0) {
                clipObj = dObj.Type;
            }
            if (dObj.ImageType) {
                if (dObj.ImageType.toString().indexOf("Sprite") >= 0) {
                    clipObj = dObj.EmbeddedModule;
                }
            }
            if (AnimObj.ID) {
                targetObj = $("#" + AnimObj.ID + " #" + Action.TargetID);
            } else {
                targetObj = {};
                targetObj.show = function () { };
                targetObj.hide = function () { };
            }
            if ((typeof Action.Visible) === "boolean") {
                if (Action.Visible) {
                    targetObj.show();
                } else {
                    targetObj.hide();
                }
            }
            if (Action.CSS) {
                targetObj.addClass(Action.CSS);
            }
            if (Action.ReCSS) {
                targetObj.removeClass(Action.ReCSS);
            }
            if (Action.X) {
                targetObj.css({ left: Action.X });
            }
            if (Action.Y) {
                targetObj.css({ top: Action.Y });
            }
            if (Action.AltText !== null) {
                targetObj.attr("title", Action.AltText);
            }
            if (Action.Width) {
                targetObj.css({ width: Action.Width });
            }
            if (Action.Height) {
                targetObj.css({ height: Action.Height });
            }
            if (Action.Text) {
                targetObj.html(Action.Text);
            }
            if (Action.Animate) {
                easing = "linear";
                if ($.isArray(Action.Animate)) {
                    easing = Action.Animate[1].easing || "linear";
                    Action.Animate = Action.Animate[0];
                }
                 frms = Action.EndFrame - Action.StartFrame;
                diff = (AnimObj.JumpTill - Action.StartFrame) / frms;
                dur = frms * AnimObj.Speed;
                prop = {};
                prop.duration = dur;
                prop.easing = easing;
                JQAnimC = new JSAnimation.JQAnimation.Animation();
                JQAnimC.TargetObject = targetObj;                
                JQAnimC.EndCSS = Action.Animate;
                JQAnimC.Prop = prop;
                JQAnimC.StartFrame = Action.StartFrame;
                JQAnimC.EndFrame = Action.EndFrame;
                AnimObj._currentJSAnimation.push(JQAnimC);
                if (AnimObj.Jump) {
                    for (prop in Action.Animate) {
                        var mval = Action.Animate[prop];
                        targetObj.css(prop, parseInt(mval) * diff);
                    };
                } else {                    
                    targetObj.animate(Action.Animate, prop, 'none');
                }
            }
            if (Action.ClipAction) {
                //console.log(dObj);
                try {
                    clipObj[Action.ClipAction]();
                } catch (ignore) { }
                try {
                    dObj.EmbeddedModule[Action.ClipAction]();
                } catch (ignore) { }
            }
            if (Action.Command) {
                AnimObj[Action.Command]();
            }
            if (Action.callBackFunction) {
                Action.callBackFunction();
            }
        }
    };
    /* Commands */
    /**
    * Animation command class
    * @class
    * @memberOf JSAnimation
    * @param {number} StartFrame - start frame number
    * @param {number} EndFrame - end frame number
    * @param {string} CommandString - command string
    */
    JSAnimation.Command = function (StartFrame, EndFrame, CommandString) {
        this.CommandString = CommandString;
        var nObj = new JSAnimation.Action(StartFrame, EndFrame, null, null, null, null, null, null, null, null, null, null);
        nObj.Command = CommandString;
        return nObj;
    };
    JSAnimation.Command.prototype = {
        toString: function () { return "JSAnimation.Command"; },
        CommandString: null
    };
    /**
    * Animation callback command class
    * @class
    * @memberOf JSAnimation
    * @param {number} FrameNumber - frame number
    * @param {function} callBackFunction - function to call
    */
    JSAnimation.CallBackFunction = function (FrameNumber, callBackFunction) {
        this.callBackFunction = callBackFunction;
        var nObj = new JSAnimation.Action(FrameNumber, FrameNumber, null, null, null, null, null, null, null, null, null, null);
        nObj.callBackFunction = callBackFunction;
        return nObj;
    };
    JSAnimation.CallBackFunction.prototype = {
        toString: function () { return "JSAnimation.CallBackFunction"; },
        callBackFunction: null
    };
    /**
    * JSAnimation Modules
    * @memberOf JSAnimation
    * @namespace JSAnimation.Modules 
    */
    JSAnimation.Modules = {};
    /**
    * Module option class
    * @class
    * @constructor
    * @memberOf JSAnimation.Modules
    */
    JSAnimation.Modules.ModuleOption = function () {
    };
    JSAnimation.Modules.ModuleOption.prototype = {
        /**
        * URL of the image
        * @type {string}
        */
        Path: null,
        /**
        * Total rows in sprite sheet
        * @type {number}
        */
        StartID: null,
        /**
        * Total columns in sprite sheet
        * @type {number}
        */
        EndID: null,
        /**
        * Speed of animation in milliseconds
        * @type {number}
        */
        Speed: null,
        /**
        * auto play animation
        * @type {booelan}
        */
        AutoPlay: null,
        /**
        * Total number of frames in sprite sheet
        * @type {number}
        */
        TotalFrames: null
    };
    /* ImageActor Module */
    JSAnimation.Modules.SEQSpriteAnimation = function (Stage, Actor) {
        this.Stage = Stage;
        this.Actor = Actor;
        this.Events = new JSAnimation.Events.SEQAnimation();
        this.Init();
        this.Actor.EmbeddedModule = this;
        return {
            Actor: this.Actor,
            nObj: $("#" + this.Stage.ID + " #" + this.Actor.ID),
            retObj: this
        };
    };
    JSAnimation.Modules.SEQSpriteAnimation.prototype = {
        toString: function () { return "JSAnimation.Modules.SEQSpriteAnimation (" + "#" + this.Stage.ID + " #" + this.Actor.ID + ")"; },
        Stage: null,
        Actor: null,
        ImgObject: null,
        Pattern: 1,
        Speed: null,
        _curID: null,
        cRow: null,
        cCol: null,
        iWidth: null,
        _playContinues: true,
        ActualFrame: 0,
        currentFrame: 0,
        _playTill: null,
        iHeight: null,
        TotalRows: null,
        TotalCols: null,
        _totalFrames: null,
        TotalFrames: null,
        Loops: 0,
        _loopsfinished: 0,
        _state: null,
        Events: null,
        MultiSprite: false,
        AutoNext: true,
        SpriteArray: [],
        CurrentSpriteIndex: null,
        CurrentSprite: null,
        Seeking: false,
        BetweenStart: null,
        ClipLoop: null,
        Init: function () {
            this.Stage.Renderer.RenderImage(this.Actor);
            this.ImgObject = $("#" + this.Stage.ID + " #" + this.Actor.ID);
            this.cRow = 0;
            this._playTill = null;
            this.cCol = 0;
            this.currentFrame = 0;
            this.ActualFrame = 0;
            this._loopsfinished = 0;
            this.iWidth = this.Actor.Width;
            this.iHeight = this.Actor.Height;
            this.SpriteArray = [];
            this.ClipLoop = null;
            this.BetweenStart = null;
            if ($.isArray(this.Actor.ModuleOptions)) {
                this.MultiSprite = true;
                this.SpriteArray = this.Actor.ModuleOptions;
            } else {
                this.SpriteArray.push(this.Actor.ModuleOptions);
            }
            var sp = 0;
            for (sp = 0; sp < this.SpriteArray.length; sp++) {
                this.ImgObject.append("<div style='position:absolute;top:0px;left:0px;width:" + this.iWidth + "px;height:" + this.iHeight + "px;' id='" + this.Actor.ID + "_sprite_" + sp + "'></div>");

                if (this.Stage.UseBase64) {
                    $("#" + this.Stage.ID + " #" + this.Actor.ID + "_sprite_" + sp).css({
                        "background-image": "url('" + this.Stage.Base64Imgs[this.SpriteArray[sp].Path.toString()] + "')",
                        "backgroundimage": "url('" + this.Stage.Base64Imgs[this.SpriteArray[sp].Path.toString()] + "')",
                        "background-position-x": 0,
                        "background-position-y": 0,
                        "background-position": "0px 0px",
                        "background-repeat": "norepeat"
                    });
                } else {
                    $("#" + this.Stage.ID + " #" + this.Actor.ID + "_sprite_" + sp).css({
                        "background-image": "url('" + this.SpriteArray[sp].Path.toString() + "')",
                        "backgroundimage": "url(" + this.SpriteArray[sp].Path.toString() + ")",
                        "background-position-x": 0,
                        "background-position-y": 0,
                        "background-position": "0px 0px",
                        "background-repeat": "norepeat"
                    });
                }

                $("#" + this.Stage.ID + " #" + this.Actor.ID + "_sprite_" + sp).addClass(this.Actor.ID + "_sprites");

                this.TotalFrames += this.SpriteArray[sp].TotalFrames;
            }

            if (this.SpriteArray[0].AutoPlay) {
                this.Events.OnAnimationPlay(this);
            }
            this.PlaySprite(0);

        },
        PlayNextSprite: function () {
            clearTimeout(this._timer);
            this.CurrentSpriteIndex++;
            if (this.CurrentSpriteIndex < this.SpriteArray.length) {
                this.PlaySprite(this.CurrentSpriteIndex);
            } else {
                this.CurrentSpriteIndex = 0;
                this.ActualFrame = 0;
                this._loopsfinished++;
                if (this.Loops > 0) {
                    if (this._loopsfinished < this.Loops) {
                        this.PlaySprite(this.CurrentSpriteIndex);
                    } else {
                        this.Stop();
                        this.Events.OnAnimationEnd();
                    }
                } else {
                    this.PlaySprite(this.CurrentSpriteIndex);
                }
                return;
            }
        },
        PlaySprite: function (spriteIndex) {
            this.CurrentSpriteIndex = spriteIndex;

            this.CurrentSprite = this.SpriteArray[this.CurrentSpriteIndex];
            this.TotalRows = this.CurrentSprite.StartID;
            this.TotalCols = (this.CurrentSprite.EndID - 1);

            this._playContinues = this.CurrentSprite.AutoPlay;
            this._totalFrames = this.CurrentSprite.TotalFrames;
            this.Speed = this.CurrentSprite.Speed;

            this._state = new JSAnimation.State.Animation();

            if (this._playContinues) {
                this._state.Playing();
            }
            this.ImgObject = $("#" + this.Actor.ID + "_sprite_" + this.CurrentSpriteIndex);
            this.ImgObject.css({
                "background-position-x": 0,
                "background-position-y": 0,
                "background-position": "0px 0px",
                "opacity": 1
            });
            var that, spi;
            that = this;
            if (this.SpriteArray[this.CurrentSpriteIndex].TotalFrames <= 3) {
                this.Pattern = 1;
            }
            if (this.Pattern === 2) {
                this.ImgObject.animate({ "opacity": 1 }, 10, function () {
                    $("." + that.Actor.ID + "_sprites:not([id='" + that.Actor.ID + "_sprite_" + that.CurrentSpriteIndex + "'])").css("opacity", 0);
                });
            } else if (this.Pattern === 1) {
                spi = 0;
                $("#" + this.Actor.ID + "_sprite_" + this.CurrentSpriteIndex).css("opacity", 1).show();
                for (spi = 0; spi < this.SpriteArray.length; spi++) {
                    if (spi !== this.CurrentSpriteIndex) {
                        $("#" + this.Actor.ID + "_sprite_" + spi).css("opacity", 0);
                        $("#" + this.Actor.ID + "_sprite_" + spi).css({
                            "background-position-x": 0,
                            "background-position-y": 0,
                            "background-position": "0px 0px"
                        });
                    }
                }
            }
            this.currentFrame = 0;
            this.cRow = 0;
            this.cCol = 0;
            if (this._playContinues === true) {
                this._state.Playing();
                this._runAction();
            } else {
                this._state.Stoped();
            }
        },
        Play: function () {
            this._playTill = null;
            this.SpriteArray[this.CurrentSpriteIndex].AutoPlay = true;
            this.Events.OnAnimationPlay(this);
            this._runAction();
        },
        PlayTill: function (frameNumber) {
            this._playTill = frameNumber;
            this.SpriteArray[this.CurrentSpriteIndex].AutoPlay = true;
            this.Events.OnAnimationPlay(this);
            this._runAction();
        },
        PlayBetween: function (startFrame, endFrame) {
            this.GoToFrame(startFrame);
            this.BetweenStart = startFrame;
            if (arguments.length === 3) {
                this.ClipLoop = arguments[2];
            }
            this.PlayTill(endFrame);
        },
        Reset: function () {
            this.Stop();
            this._loopsfinished = 0;
            this.currentFrame = 0;
            this.ActualFrame = 0;
            this.cRow = 0;
            this.cCol = 0;
            this.ClipLoop = null;
            this.BetweenStart = null;
            this.CurrentSpriteIndex = 0;
            var curSpriteID, curSpriteObj;
            curSpriteID = this.Actor.ID + "_sprite_" + this.CurrentSpriteIndex;
            curSpriteObj = $("#" + this.Stage.ID + " #" + curSpriteID);
            curSpriteObj.css({
                "background-position-x": 0,
                "background-position-y": 0,
                "background-position": "0px 0px"
            });
            if (this.SpriteArray[0].AutoPlay) {
                this.Events.OnAnimationPlay(this);
            }
            if (arguments.length === 0) {
                this.PlaySprite(0);
            }
        },
        Seek: function (to) {
            if (this.ActualFrame < to) {
                this.Seeking = true;
                this._playTill = to;
                //while (this.ActualFrame <= to)
                //{
                this._runAction();
                //}
            }
        },
        GoToFrame: function (frame) {
            this.Reset(true);
            this._playTill = frame;
            this.Seeking = true;
            this._runAction();
        },
        Stop: function () {
            clearTimeout(this._timer);
            try {
                this.Events.OnAnimationStop();
            } catch (ignore) { }
            this._state.Stoped();
        },
        _runAction: function () {
            if (this._playTill !== null) {
                if ((this.ActualFrame === this._playTill)) {
                    if (this.ClipLoop === null) {
                        this.BetweenStart = null;
                        this.Events.OnAnimationEnd();
                        this.Stop();
                        this.Seeking = false;
                    } else {
                        this.PlayBetween(this.BetweenStart, this._playTill, this.ClipLoop);
                    }
                    return;
                }
            }
            var ClipObj = this;
            if (this.AutoNext) {
                if (this.Seeking === false) {
                    this._timer = setTimeout(function () { ClipObj._changeImage(ClipObj, true); }, this.Speed);
                } else {
                    this._changeImage(this, true);
                }
            }
        },
        _changeImage: function (ClipObj, autoRun) {
            ClipObj.currentFrame++;
            ClipObj.ActualFrame++;


            if (ClipObj._totalFrames !== null) {
                if (ClipObj.currentFrame > ClipObj._totalFrames) {
                    ClipObj.PlayNextSprite();
                    return;
                }
            }
            var imgX, imgY, bgpos;
            imgX = ClipObj.iWidth * ClipObj.cCol;
            imgY = ClipObj.iHeight * ClipObj.cRow;
            imgX = imgX * -1;
            imgY = imgY * -1;

            bgpos = imgX + "px " + imgY + "px";
            ClipObj.ImgObject.css({
                "background-position-x": imgX - 1,
                "background-position-y": imgY,
                "background-position": bgpos,
                "width": ClipObj.iWidth,
                "height": ClipObj.iHeight
            });
            ClipObj.Events.OnAnimationFrameChange(ClipObj);
            ClipObj.cCol++;
            if (ClipObj.cCol <= ClipObj.TotalCols) {
                if (autoRun) {
                    ClipObj._runAction();
                }
            } else {
                ClipObj.cRow++;
                if (ClipObj.cRow < ClipObj.TotalRows) {
                    ClipObj.cCol = 0;
                    if (autoRun) {
                        ClipObj._runAction();
                    }
                } else {
                    ClipObj.PlayNextSprite();
                }
            }
        },
        _changeImagexxx: function (ClipObj, autoRun) {
            ClipObj.currentFrame++;
            if (ClipObj.TotalFrames !== null) {
                if (ClipObj.currentFrame > ClipObj.TotalFrames) {
                    ClipObj.PlayNextSprite();
                }
            }
            var imgX, imgY, bgpos;
            imgX = ClipObj.iWidth * ClipObj.cCol;
            imgY = ClipObj.iHeight * ClipObj.cRow;
            imgX = imgX * -1;
            imgY = imgY * -1;
            bgpos = imgX + "px " + imgY + "px";
            ClipObj.ImgObject.css({
                "background-position-x": imgX - 1,
                "background-position-y": imgY,
                "background-position": bgpos
            });

            ClipObj.Events.OnAnimationFrameChange(ClipObj);

            ClipObj.cCol++;
            if (ClipObj.cCol <= ClipObj.TotalCols) {
                if (autoRun) {
                    ClipObj._runAction();
                }
            } else {
                ClipObj.cRow++;
                if (ClipObj.cRow < ClipObj.TotalRows) {
                    ClipObj.cCol = 0;
                    if (autoRun) {
                        ClipObj._runAction();
                    }
                } else {
                    if (ClipObj.Loops > 0) {
                        if (ClipObj._loopsfinished >= ClipObj.Loops) {
                            ClipObj.Stop();
                            ClipObj.Events.OnAnimationEnd();

                        } else {
                            ClipObj.cCol = 0;
                            ClipObj.cRow = 0;
                            ClipObj.PlayNextSprite();
                        }
                    } else {
                        ClipObj.cCol = 0;
                        ClipObj.cRow = 0;
                        ClipObj.PlayNextSprite();
                    }
                }
            }
        }
    };
    /* SEQ 2*/
    JSAnimation.Modules.SEQImageAnimation = function (Stage, Actor) {
        this.Stage = Stage;
        this.Actor = Actor;
        this.Speed = this.Actor.Speed;
        this.Events = new JSAnimation.Events.SEQAnimation();
        this.Init();
        this.Actor.EmbeddedModule = this;

        return {
            Actor: this.Actor,
            nObj: $("#" + this.Stage.ID + " #" + this.Actor.ID),
            retObj: this
        };
    };
    JSAnimation.Modules.SEQImageAnimation.prototype = {
        toString: function () { return "JSAnimation.Modules.SEQImageAnimation (" + "#" + this.Stage.ID + " #" + this.Actor.ID + ")"; },
        Stage: null,
        Actor: null,
        ImgObject: null,
        RandomSpeed: true,
        Speed: null,
        _curID: null,
        _timer: null,
        _playContinues: true,
        Loops: 0,
        _loopsfinished: 0,
        _state: null,
        Events: null,
        Init: function () {
            this.Stage.Renderer.RenderImage(this.Actor);
            this.ImgObject = $("#" + this.Stage.ID + " #" + this.Actor.ID + " img");
            this._curID = this.Actor.ModuleOptions.StartID;
            this._playContinues = this.Actor.ModuleOptions.AutoPlay;
            this._state = new JSAnimation.State.Animation();

            // this.TotalRows = this.Actor.ModuleOptions.StartID;
            //// this.TotalCols = (this.Actor.ModuleOptions.EndID - 1);
            // this._playContinues = this.Actor.ModuleOptions.AutoPlay;
            // this.TotalFrames = this.Actor.ModuleOptions.TotalFrames;

            if (this._playContinues) {
                this._state.Playing();
            } else {
                this._state.Stoped();
            }
            this._runAction();

            //}
        },
        Reset: function () {
            this.Stop();
            this._loopsfinished = 0;
            this._curID = this.Actor.ModuleOptions.StartID;
            var imgName = this.Actor.ModuleOptions.Path.toString().replace("$", this._addDigits(this._curID, 4));
            this.ImgObject.attr("src", imgName);
            //this._runAction();
        },
        Play: function () {
            this._playContinues = true;
            this._state.Playing();
            this._runAction();
        },
        _runAction: function () {
            var ClipObj, spd;
            ClipObj = this;
            spd = 0;
            if (this.RandomSpeed) {
                spd = (Math.random() * 3) * this.Speed;
            } else {
                spd = this.Speed;
            }
            this._timer = setTimeout(function () { ClipObj._changeImage(ClipObj); }, spd);
        },
        Stop: function () {
            clearTimeout(this._timer);
            this._state.Stoped();
        },
        _changeImage: function (ClipObj) {
            ClipObj._curID++;
            if (ClipObj._curID > ClipObj.Actor.ModuleOptions.EndID) {
                ClipObj._curID = ClipObj.Actor.ModuleOptions.StartID;
                ClipObj._loopsfinished++;
                ClipObj.Events.OnLoopEnd();
                if (ClipObj.Loops > 0) {
                    if (ClipObj._loopsfinished >= ClipObj.Loops) {
                        ClipObj.Stop();
                        ClipObj.Events.OnAnimationEnd();
                        return;
                    }
                }
            }
            if (ClipObj._curID === 1) {
                ClipObj.Events.OnLoopStart();
            }
            var imgName = ClipObj.Actor.ModuleOptions.Path.toString().replace("$", ClipObj._addDigits(ClipObj._curID, 4));
            ClipObj.ImgObject.attr("src", imgName);
            ClipObj.Events.OnAnimationFrameChange();

            if (ClipObj.Actor.ModuleOptions.StartID !== ClipObj.Actor.ModuleOptions.EndID) {
                if (ClipObj._playContinues === true) {
                    if (ClipObj._state.isPlaying) {
                        ClipObj._runAction();
                        ClipObj.Events.OnAnimationPlay();
                    }
                }
            }
        },
        _addDigits: function (number, digit) {
            var numZeros, str, z;
            numZeros = digit - number.toString().length;
            str = "";
            z = 0;
            for (z = 0; z < numZeros; z++) {
                str = str + "0";
            }
            str = str + number;
            return str;
        }
    };
    /* end */

    /* Js Animated object */
    JSAnimation.JQAnimation = {};
    JSAnimation.JQAnimation.Animation = function () {
        return this;
    };
    JSAnimation.JQAnimation.Animation.prototype = {
        TargetObject: null,
        EndCSS: null,
        Prop: null,
        StartFrame: null,
        EndFrame: null
    };
    /* Js Animated object ends */

    /* Events */
    /**
    * JSAnimation events
    * @namespace JSAnimation.Events
    */
    JSAnimation.Events = {};
    /**
    * Animation events class
    * @class
    * @fires JSAnimation.Events.Animation#OnAnimationPlay
    * @fires JSAnimation.Events.Animation#OnAnimationStop
    * @fires JSAnimation.Events.Animation#OnAnimationEnd
    * @fires JSAnimation.Events.Animation#OnAnimationFrameChange
    * @fires JSAnimation.Events.Animation#OnAtFrame
    */
    JSAnimation.Events.Animation = function () {
        return this;
    };
    JSAnimation.Events.Animation.prototype = {
        _OnAtFrameFrameNumber: null,
        /**
        * On animation start play
        * @event  JSAnimation.Events.Animation#OnAnimationPlay
        */
        OnAnimationPlay: function () { },
        /**
        * On animation stop
        * @event  JSAnimation.Events.Animation#OnAnimationStop
        */
        OnAnimationStop: function () { },
        /**
        * On animation ends
        * @event  JSAnimation.Events.Animation#OnAnimationEnd
        */
        OnAnimationEnd: function () { },
        /**
        * On animation frame changes
        * @event  JSAnimation.Events.Animation#OnAnimationFrameChange
        */
        OnAnimationFrameChange: function () { },
        /**
       * On animation at frame
       * @event  JSAnimation.Events.Animation#OnAtFrame
       */
        OnAtFrame: function (frameNumber) {
            this._OnAtFrameFrameNumber = frameNumber;
        }
    };
    JSAnimation.Events.SEQAnimation = function () {
        return this;
    };
    JSAnimation.Events.SEQAnimation.prototype = {
        OnLoopStart: function () { },
        OnLoopEnd: function () { },
        OnAnimationEnd: function () { },
        OnAnimationPlay: function () { },
        OnAnimationFrameChange: function () { }
    };
    /* Events ends */

    /* State */
    JSAnimation.State = {};
    JSAnimation.State.Animation = function () {
        return this;
    };
    JSAnimation.State.Animation.prototype = {
        isPlaying: false,
        isStoped: false,
        Playing: function () { this.isPlaying = true; this.isStoped = false; },
        Stoped: function () { this.isStoped = true; this.isPlaying = false; }
    };
    /* State ends */

    /* Action */

    /**
    * Animation Action class
    * @class
    * @memberOf JSAnimation
    * @constructor
    * @param {number} StartFrame - Start frame number of the action
    * @param {number} EndFrame - End frame number of the action
    * @param {string} TargetID - Action.ID or id of DOM element
    * @param {number} X - X or left position
    * @param {number} Y - Y or top position
    * @param {number} Width - width of the actor
    * @param {number} Height - heigth of the actor
    * @param {string} CSS - css class name
    * @param {string} Text - inner text or html
    * @param {boolean} Visible - visibility fo the actor
    * @param {boolean} Animate - animate if clip action
    * @param {string} AltText - Alt/Title text
    */
    JSAnimation.Action = function (StartFrame, EndFrame, TargetID, X, Y, Width, Height, CSS, Text, Visible, Animate, ClipAction, AltText) {
        this.StartFrame = StartFrame;
        this.EndFrame = EndFrame;

        this.TargetID = TargetID;

        this.X = X;
        this.Y = Y;
        this.Width = Width;
        this.Height = Height;
        this.CSS = CSS;
        this.Text = Text;
        this.Visible = Visible;
        this.Animate = Animate;
        this.ClipAction = ClipAction;
        this.AltText = AltText;
        return this;
    };
    JSAnimation.Action.prototype = {
        toString: function () {
            if (this.TargetID) {
                return "JSAnimation.Action (" + this.TargetID.toString() + ")";
            }
            return "JSAnimation.Action ()";
        },
        StartFrame: null,
        EndFrame: null,
        TargetID: null,
        X: null,
        Y: null,
        Width: null,
        Height: null,
        CSS: null,
        Text: null,
        Visible: null,
        Animate: null,
        Actor: null,
        Command: null,
        callBackFunction: null,
        AltText: null,
        ClipAction: function () { }
    };


    /**
    * Animation imageactor class
    * @class
    * @memberOf JSAnimation
    * @constructor
    * @param {string} ID - ID of DOM element
    * @param {number} X - X or left position
    * @param {number} Y - Y or top position
    * @param {number} Width - width of the actor
    * @param {number} Height - heigth of the actor
    * @param {string} CSS - css class name
    * @param {boolean} Visible - visibility fo the actor
    * @param {string} ImageType - "Sprite" or "Image"
    * @param {JSAnimation.Modules.ModuleOption} ModuleOptions - Module options
    * @param {string} AltText - Alt/Title text
    */
    JSAnimation.ImageActor = function (ID, X, Y, Width, Height, CSS, Visible, ImageType, ModuleOptions, AltText) {
        //Path, StartID, EndID, Speed, AutoPlay
        this.ID = ID;
        this.X = X;
        this.Y = Y;
        this.Width = Width;
        this.Height = Height;
        this.CSS = CSS;
        this.Visible = Visible;
        this.AltText = AltText;
        this.ImageType = ImageType; //SPRITE OR IMAGE

        if (ModuleOptions !== null) {
            this.ModuleOptions = new JSAnimation.Modules.ModuleOption();
            this.ModuleOptions = ModuleOptions;
        }
        return this;
    };
    JSAnimation.ImageActor.prototype = {
        /**
        * String representation
        * @return {string}
        */
        toString: function () { return "JSAnimation.ImageActor (" + this.ID.toString() + ")"; },
        /**
        * Unique identifier
        * @type {string}
        */
        ID: null,
        /**
        * Jquery object
        * @type {object}
        */
        JqObject: null,
        /**
        * X cordinat or "left"
        * @type {number}
        */
        X: null,
        /**
        * width of actor
        * @type {number}
        */
        Y: null,
        /**
        * width of actor
        * @type {number}
        */
        Width: null,
        /**
       * height of actor
       * @type {number}
       */
        Height: null,
        /**
       * CSS class name
       * @type {string}
       */
        CSS: null,
        /**
       * Default visibality
       * @type {boolean}
       */
        Visible: null,
        Controller: null,
        Type: "ImageActor",
        ImageType: null,    //SPRITE OR IMAGE
        /**
          * Module Object options
          * @type {JSAnimation.Modules.ModuleOption}
         */
        ModuleOptions: null,
        /**
        * Alt text
        * @type {string}
        */
        AltText: null
    };
    /* End Sprite */
    /*   Actors */

    /**
    * Animation actor class
    * @class
    * @memberOf JSAnimation
    * @constructor
    * @param {string} ID - ID of DOM element
    * @param {string} Type - Image or Text
    * @param {number} X - X or left position
    * @param {number} Y - Y or top position
    * @param {number} Width - width of the actor
    * @param {number} Height - heigth of the actor
    * @param {string} CSS - css class name
    * @param {string} Text - inner text or html
    * @param {boolean} Visible - visibility fo the actor
    * @param {string} AltText - Alt/Title text
    */
    JSAnimation.Actor = function (ID, Type, X, Y, Width, Height, CSS, Text, Visible, AltText) {
        this.ID = ID;
        this.Type = Type;
        this.X = X;
        this.Y = Y;
        this.Width = Width;
        this.Height = Height;
        this.CSS = CSS;
        this.Text = Text;
        this.Visible = Visible;
        this.JqObject = null;
        this.AltText = AltText;
        return this;
    };
    JSAnimation.Actor.prototype = {
        /**
        * String representation
        * @return {string}
        */
        toString: function () { return "JSAnimation.Actor (" + this.ID.toString() + ")"; },
        /**
        * JQuery object of the actor
        * @type {object}
        */
        JqObject: null,
        /**
        * Unique identifier
        * @type {string}
        */
        ID: null,
        /**
        * Type of actor
        * @type {string}
        */
        Type: null,
        /**
        * X cordinat or "left"
        * @type {number}
        */
        X: null,
        /**
        * Y cordinat or "top"
        * @type {number}
        */
        Y: null,
        /**
        * width of actor
        * @type {number}
        */
        Width: null,
        /**
        * height of actor
        * @type {number}
        */
        Height: null,
        /**
        * text ro HTML text
        * @type {string}
        */
        Text: null,
        /**
        * Default visibality
        * @type {boolean}
        */
        Visible: null,
        /**
        * CSS class name
        * @type {string}
        */
        CSS: null,
        /**
        * Module Object
        * @type {object}
        */
        EmbeddedModule: null,
        AltText: null
    };
}(window));
