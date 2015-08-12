(function(){
	function iter$(a){ return a ? (a.toArray ? a.toArray() : a) : []; };
	
	require('imba');
	
	// externs;
	
	var ESCAPE_KEY = 27;
	var ENTER_KEY = 13;
	Todos = [];
	
	
	BENCH = function(times,renderer) {
		if(times === undefined) times = 1000;
		if(renderer === undefined) renderer = 'render';
		console.log("benchmark it");
		console.time("bench");
		
		var app = id$('app');
		var i = times;
		while (--i > 0){
			app[renderer]();
		};
		console.timeEnd("bench");
		return;
	};
	
	Imba.extendTag('htmlelement', function(tag){
		
		tag.prototype.flag = function (flag,bool){
			this._flags || (this._flags = {});
			
			if (arguments.length == 2) {
				if (this._flags[flag] != !!bool) {
					bool ? (this._dom.classList.add(flag)) : (this._dom.classList.remove(flag));
					this._flags[flag] = !!bool;
				};
			} else if (!this._flags[flag]) {
				this._dom.classList.add(flag);
				this._flags[flag] = true;
			};
			
			return this;
		};
		
		tag.prototype.unflag = function (flag){
			if (this._flags && this._flags[flag]) {
				this._flags[flag] = false;
				this._dom.classList.remove(flag);
			};
			
			return this;
		};
	});
	
	
	/*
	
	Creating a plain class for our todos
	
	*/
	
	
	function Todo(title,completed){
		if(completed === undefined) completed = false;
		this._id = id++;
		this._title = title;
		this._completed = completed;
		this._editing = false;
	};
	
	var id = 0;
	
	
	Todo.prototype.__title = {name: 'title'};
	Todo.prototype.title = function(v){ return this._title; }
	Todo.prototype.setTitle = function(v){ this._title = v; return this; };
	
	Todo.prototype.__completed = {name: 'completed'};
	Todo.prototype.completed = function(v){ return this._completed; }
	Todo.prototype.setCompleted = function(v){ this._completed = v; return this; };
	
	Todo.prototype.__editing = {name: 'editing'};
	Todo.prototype.editing = function(v){ return this._editing; }
	Todo.prototype.setEditing = function(v){ this._editing = v; return this; };
	
	Todo.prototype.id = function (){
		return this._id;
	};
	
	// returns a unique string that will change whenever
	// anything changes on the todo
	Todo.prototype.hash = function (){
		return "" + this._title + this._completed + this._editing;
	};
	
	Todo.prototype.toJSON = function (){
		return {title: this.title(),completed: this.completed()};
	};
	
	
	
	// this way of caching is not the 'Imba way' - it is merely a very simple way
	// to do something similar to React 'shouldComponentUpdate'. You can implement
	// this however you want - you merely try to figure out whether anything have
	// changed inside tag#commit, and then rerender if it has.
	Imba.defineTag('todo','li', function(tag){
		
		tag.prototype.commit = function (){
			// commit is always called when a node is rendered as part of an outer tree
			// this is where we decide whether to cascade the render through to inner
			// parts of this.
			if (this._hash != this.object().hash()) {
				this._hash = this.object().hash();
				return this.render();
			};
		};
		
		
		tag.prototype.render = function (){
			var t0;
			var todo = this._object;
			
			return this.flag('completed',(this.object().completed())).flag('editing',(this.object().editing())).setChildren(Imba.static([
				(t0 = this.$a || (this.$a = t$('div'))).flag('view').setContent(Imba.static([
					(t0.$$a = t0.$$a || t$('label')).setHandler('dblclick',['edit',this.object()]).setContent(Imba.static([this.object().title()],1)).end(),
					(t0.$$b = t0.$$b || t$('input')).flag('toggle').setType('checkbox').setHandler('tap',['toggle',this.object()]).setChecked((this.object().completed())).end(),
					(t0.$$c = t0.$$c || t$('button')).flag('destroy').setHandler('tap',['drop',this.object()]).end()
				],1)).end(),
				(this.object().editing()) && (
					(this.$b = this.$b || t$('edit_todo')).flag('edit').setType('text').setObject(this.object()).end()
				)
			],1)).synced();
		};
		
		// onkeydown from inner element cascade through
		tag.prototype.onkeydown = function (e){
			e.halt();
			if (e.which() == ENTER_KEY) this.blur();
			if (e.which() == ESCAPE_KEY) { return this.cancel() };
		};
	});
	
	
	
	Imba.defineTag('new_todo_input','input', function(tag){
		
		tag.prototype.onkeydown = function (e){
			var v_;
			if (e.which() == ENTER_KEY) {
				id$('app').add(this.value().trim());
				return (this.setValue(v_=""),v_);
			};
		};
	});
	
	
	Imba.defineTag('edit_todo','input', function(tag){
		
		tag.prototype.onkeydown = function (e){
			e.halt();
			if (e.which() == ENTER_KEY) this.blur();
			if (e.which() == ESCAPE_KEY) { return this.cancel() };
		};
		
		tag.prototype.onfocusout = function (){
			return this.object().editing() ? (this.submit()) : (id$('app').render());
		};
		
		tag.prototype.commit = function (){
			var self=this;
			if (self.object().editing() == self._active) { return self };
			
			if (self._active = self.object().editing()) {
				self.setValue(self.object().title());
				setTimeout(function() {
					return self.focus();
				},10);
			};
			return self;
		};
		
		tag.prototype.submit = function (){
			this.object().setEditing(false);
			this.value().trim() ? (id$('app').rename(this.object(),this.value().trim())) : (id$('app').drop(this.object()));
			return this;
		};
		
		tag.prototype.cancel = function (){
			this.object().setEditing(false);
			return this.blur();
		};
	});
	
	
	Imba.defineSingletonTag('app', function(tag){
		
		tag.prototype.hash = function (){
			return window.location.hash;
		};
		
		tag.prototype.awaken = function (){
			var self=this;
			self.load();
			window.addEventListener('hashchange',function() {
				return self.render();
			});
			self.render();
			return self;
		};
		
		tag.prototype.todos = function (){
			return Todos;
		};
		
		tag.prototype.remaining = function (){
			return this.todos().filter(function(todo) {
				return !todo.completed();
			});
		};
		
		tag.prototype.completed = function (){
			return this.todos().filter(function(todo) {
				return todo.completed();
			});
		};
		
		tag.prototype.dirty = function (){
			this.persist();
			return this.render();
		};
		
		tag.prototype.add = function (title){
			if (title.trim()) {
				Todos.push(new Todo(title.trim()));
				this.dirty();
			};
			return this;
		};
		
		tag.prototype.toggle = function (todo){
			todo.setCompleted(!todo.completed());
			return this.dirty();
		};
		
		tag.prototype.toggleAll = function (e){
			for (var i=0, ary=iter$(this.todos()), len=ary.length; i < len; i++) {
				ary[i].setCompleted(e.target().checked());
			};
			return this.dirty();
		};
		
		tag.prototype.edit = function (todo){
			todo.setEditing(true);
			return this.dirty();
		};
		
		// rename a todo
		tag.prototype.rename = function (todo,title){
			todo.setTitle(title);
			return this.dirty();
		};
		
		// remove a todo from all lists
		tag.prototype.drop = function (todo){
			// simply removing it from the list of todos
			Todos = Todos.filter(function(t) {
				return t != todo;
			});
			return this.dirty();
		};
		
		// remove all completed todos
		tag.prototype.clear = function (){
			Todos = Todos.filter(function(todo) {
				return !todo.completed();
			});
			q$$('.toggle-all').setChecked(false);
			return this.dirty();
		};
		
		// load todos from localstorage
		tag.prototype.load = function (){
			var items = JSON.parse(localStorage.getItem('todos-imba') || '[]');
			Todos = items.map(function(item) {
				return new Todo(item.title,item.completed);
			});
			return this;
		};
		
		// persist todos to localstorage
		tag.prototype.persist = function (){
			var json = JSON.stringify(Todos);
			if (json != this._json) { localStorage.setItem('todos-imba',this._json = json) };
			return this;
		};
		
		// this is the method that actually takes care of rendering the whole app
		// Imba has a very efficient way of caching the actual elements.
		// this method can easily be called every frame without any performance
		// degradation at all. 
		//
		// A low-end mbp retina (safari 9.0) can render this example 30000 ops/sec
		// or 500 ops/frame. With this kind of performance there is little
		// need for the added complexity of registering listeners, tracking
		// dependencies, or manually calling render.
		tag.prototype.render = function (){
			var t0, self=this, t1, t2;
			var all = this.todos();
			var active = this.remaining();
			var done = this.completed();
			var items = {'#/completed': done,'#/active': active}[this.hash()] || all;
			
			return this.setChildren(Imba.static([
				(t0 = this.$a || (this.$a = t$('header'))).flag('header').setContent(Imba.static([
					(t0.$$a = t0.$$a || t$('h1')).setText("todos").end(),
					(t0.$$b = t0.$$b || t$('new_todo_input')).flag('new-todo').setType('text').setPlaceholder('What needs to be done?').end()
				],1)).end(),
				
				(all.length > 0) && (Imba.static([
					(t0 = self.$b || (self.$b = t$('section'))).flag('main').setContent(Imba.static([
						(t0.$$a = t0.$$a || t$('input')).flag('toggle-all').setType('checkbox').setHandler('change','toggleAll').end(),
						(t1 = t0.$$b || (t0.$$b = t$('ul'))).flag('todo-list').setContent(Imba.static([(function(t1) {
							for (var i=0, ary=iter$(items), len=ary.length, todo, res=[]; i < len; i++) {
								todo = ary[i];
								res.push((t1['_' + todo.id()] = t1['_' + todo.id()] || t$('todo')).setObject(todo).end());
							};
							return res;
						})(t1)],1)).end()
					],1)).end(),
					
					(t0 = self.$c || (self.$c = t$('footer'))).flag('footer').setContent(Imba.static([
						(t1 = t0.$$a || (t0.$$a = t$('span'))).flag('todo-count').setContent(Imba.static([
							(t1.$$a = t1.$$a || t$('strong')).setText(("" + (active.length) + " ")).end(),
							active.length == 1 ? ('item left') : ('items left')
						],1)).end(),
						(t1 = t0.$$b || (t0.$$b = t$('ul'))).flag('filters').setContent(Imba.static([
							(t2 = t1.$$a || (t1.$$a = t$('li'))).setContent(Imba.static([(t2.$$a = t2.$$a || t$('a')).flag('selected',(items == all)).setHref('#/').setText('All').end()],1)).end(),
							(t2 = t1.$$b || (t1.$$b = t$('li'))).setContent(Imba.static([(t2.$$a = t2.$$a || t$('a')).flag('selected',(items == active)).setHref('#/active').setText('Active').end()],1)).end(),
							(t2 = t1.$$c || (t1.$$c = t$('li'))).setContent(Imba.static([(t2.$$a = t2.$$a || t$('a')).flag('selected',(items == done)).setHref('#/completed').setText('Completed').end()],1)).end()
						],1)).end(),
						
						(done.length > 0) && (
							(t0.$$c = t0.$$c || t$('button')).flag('clear-completed').setHandler('tap','clear').setText('Clear completed').end()
						)
					],1)).end()
				],2))
			],1)).synced();
		};
	});
	
	
	
	(q$$('.todoapp') || q$$('body')).append(id$('app'));
	
	/*
	
	DEMO
	
	*/

})()