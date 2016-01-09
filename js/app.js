(function(){
	function iter$(a){ return a ? (a.toArray ? a.toArray() : a) : []; };
	
	var ESCAPE_KEY = 27;
	var ENTER_KEY = 13;
	
	// Define a simple class for our data objects
	function Todo(title,completed){
		if(completed === undefined) completed = false;
		this._id = id++;
		this._title = title;
		this._completed = completed;
	};
	
	var id = 0;
	
	Todo.prototype.title = function(v){ return this._title; }
	Todo.prototype.setTitle = function(v){ this._title = v; return this; };
	Todo.prototype.completed = function(v){ return this._completed; }
	Todo.prototype.setCompleted = function(v){ this._completed = v; return this; };
	
	Todo.prototype.id = function (){
		return this._id;
	};
	
	Todo.prototype.toJSON = function (){
		return {title: this.title(),completed: this.completed()};
	};
	
	
	// custom tag type for todo that inherits from li
	tag$.defineTag('todo', 'li', function(tag){
		
		tag.prototype.render = function (){
			var t0, t1;
			return this.flag('completed',(this.object().completed())).setChildren([
				(t0 = this.$a=this.$a || tag$.$div().flag('view')).setContent([
					(t1 = t0.$$a=t0.$$a || tag$.$label().setHandler('dblclick','edit',this)).setContent(this.object().title(),3).end(),
					(t0.$$b = t0.$$b || tag$.$input().flag('toggle').setType('checkbox').setHandler('tap','toggle',this)).setChecked((this.object().completed())).end(),
					(t0.$$c = t0.$$c || tag$.$button().flag('destroy').setHandler('tap','drop',this)).end()
				],2).end(),
				(this._edit = this._edit || tag$.$input().setRef('edit',this).setType('text').setHandler('blur','save',this)).end()
			],2).synced();
		};
		
		tag.prototype.toggle = function (){
			return this.up(q$('._app',this)).toggle(this.object());
		};
		
		// triggered by doubleclicking the title
		// sets value if input to current title
		// and flags the <todo> with .editing.
		tag.prototype.edit = function (){
			this.flag('editing');
			this._edit.setValue(this.object().title());
			return this._edit.focus();
		};
		
		tag.prototype.save = function (){
			if (this.hasFlag('editing')) {
				this.unflag('editing');
				return this.up(q$('._app',this)).rename(this.object(),this._edit.value());
			};
		};
		
		tag.prototype.drop = function (){
			return this.up(q$('._app',this)).drop(this.object());
		};
		
		tag.prototype.onkeydown = function (e){
			switch (e.which()) {
				case ENTER_KEY:
					return this.save();break;
				
				case ESCAPE_KEY:
					return this.unflag('editing');break;
			
			};
		};
	});
	
	
	tag$.defineTag('app', function(tag){
		
		tag.prototype.todos = function(v){ return this._todos; }
		tag.prototype.setTodos = function(v){ this._todos = v; return this; };
		
		tag.prototype.hash = function (){
			return window.location.hash;
		};
		
		tag.prototype.build = function (){
			var self = this;
			self.load();
			window.addEventListener('hashchange',function() { return self.scheduler().mark(); });
			return self.schedule();
		};
		
		tag.prototype.render = function (){
			var t0, t1, t2, self = this, t3, t4, t5, t6, t7, t8, t9, t10;
			var items = this.todos();
			var active = this.remaining();
			var done = this.completed();
			
			
			if (this.hash() == '#/completed') {
				items = done;
			} else if (this.hash() == '#/active') {
				items = active;
			};
			
			return this.setChildren([
				(t0 = this.$a=this.$a || tag$.$header().flag('header')).setContent([
					(t0.$$a = t0.$$a || tag$.$h1()).setText("todos").end(),
					(t1 = t0.$$b=t0.$$b || tag$.$form()).setContent((this._adder = this._adder || tag$.$input().setRef('adder',this).flag('new-todo').setType('text').setPlaceholder('What needs to be done?')).end(),2).end()
				],2).end(),
				
				(this.todos().length > 0) ? (Imba.static([
					(t2 = self.$b=self.$b || tag$.$section().flag('main')).setContent([
						(t2.$$a = t2.$$a || tag$.$input().flag('toggle-all').setType('checkbox').setHandler('change','toggleAll',this)).setChecked((active.length == 0)).end(),
						(t3 = t2.$$b=t2.$$b || tag$.$ul().flag('todo-list')).setContent(
							(function(t3) {
								for (var i = 0, ary = iter$(items), len = ary.length, todo, res = []; i < len; i++) {
									todo = ary[i];
									res.push((t3['_' + todo.id()] = t3['_' + todo.id()] || tag$.$todo()).setObject(todo).end());
								};
								return res;
							})(t3)
						,3).end()
					],2).end(),
					
					(t4 = self.$c=self.$c || tag$.$footer().flag('footer')).setContent([
						(t5 = t4.$$a=t4.$$a || tag$.$span().flag('todo-count')).setContent([
							(t6 = t5.$$a=t5.$$a || tag$.$strong()).setContent(("" + (active.length) + " "),3).end(),
							active.length == 1 ? ('item left') : ('items left')
						],1).end(),
						(t7 = t4.$$b=t4.$$b || tag$.$ul().flag('filters')).setContent([
							(t8 = t7.$$a=t7.$$a || tag$.$li()).setContent((t8.$$a = t8.$$a || tag$.$a().setHref('#/')).flag('selected',(items == self.todos())).setText('All').end(),2).end(),
							(t9 = t7.$$b=t7.$$b || tag$.$li()).setContent((t9.$$a = t9.$$a || tag$.$a().setHref('#/active')).flag('selected',(items == active)).setText('Active').end(),2).end(),
							(t10 = t7.$$c=t7.$$c || tag$.$li()).setContent((t10.$$a = t10.$$a || tag$.$a().setHref('#/completed')).flag('selected',(items == done)).setText('Completed').end(),2).end()
						],2).end(),
						
						(done.length > 0) ? (
							(t4.$$c = t4.$$c || tag$.$button().flag('clear-completed').setHandler('tap','archive',self)).setText('Clear completed').end()
						) : void(0)
					],1).end()
				],2)) : void(0)
			],1).synced();
		};
		
		tag.prototype.remaining = function (){
			return this.todos().filter(function(todo) { return !todo.completed(); });
		};
		
		tag.prototype.completed = function (){
			return this.todos().filter(function(todo) { return todo.completed(); });
		};
		
		tag.prototype.dirty = function (){
			return this.persist();
		};
		
		tag.prototype.add = function (title){
			if (title.trim()) {
				this.todos().push(new Todo(title.trim()));
				return this.persist();
			};
		};
		
		tag.prototype.toggle = function (todo){
			todo.setCompleted(!todo.completed());
			return this.persist();
		};
		
		tag.prototype.toggleAll = function (e){
			for (var i = 0, ary = iter$(this.todos()), len = ary.length; i < len; i++) {
				ary[i].setCompleted(e.target().checked());
			};
			return this.persist();
		};
		
		// rename a todo
		// drops the todo if title is blank
		tag.prototype.rename = function (todo,title){
			todo.setTitle(title.trim());
			return todo.title() ? (this.persist()) : (this.drop(todo));
		};
		
		// remove a todo from collection
		tag.prototype.drop = function (todo){
			// simply removing it from the list of todos
			this.setTodos(this.todos().filter(function(t) { return t != todo; }));
			return this.persist();
		};
		
		// remove all completed todos from collection
		tag.prototype.archive = function (){
			this.setTodos(this.remaining());
			return this.persist();
		};
		
		// load todos from localstorage
		tag.prototype.load = function (){
			var items = JSON.parse(window.localStorage.getItem('todos-imba') || '[]');
			this.setTodos(items.map(function(item) { return new Todo(item.title,item.completed); }));
			return this;
		};
		
		// persist todos to localstorage
		tag.prototype.persist = function (){
			var json = JSON.stringify(this.todos());
			if (json != this._json) { window.localStorage.setItem('todos-imba',this._json = json) };
			return this;
		};
		
		tag.prototype.onsubmit = function (e){
			var v_;
			e.cancel().halt();
			this.add(this._adder.value());
			return (this._adder.setValue(v_ = ''),v_);
		};
	});
	
	
	var app = tag$.$app().setId('app').setTodos([]).end();
	return (q$$('.todoapp') || q$$('body')).append(app);

})()