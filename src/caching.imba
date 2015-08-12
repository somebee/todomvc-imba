
require 'imba'

extern window, localStorage

var ESCAPE_KEY = 27
var ENTER_KEY = 13
Todos = []


BENCH = do |times = 1000, renderer = 'render'|
	console.log "benchmark it"
	console.time("bench")

	var app = #app
	var i = times
	while --i > 0
		app[renderer]()
	console.timeEnd("bench")
	return

extend tag htmlelement

	def flag flag, bool
		@flags ||= {}

		if arguments:length == 2
			if @flags[flag] != !!bool
				bool ? @dom:classList.add(flag) : @dom:classList.remove(flag)
				@flags[flag] = !!bool
		elif !@flags[flag]
			@dom:classList.add(flag)
			@flags[flag] = yes

		return self

	def unflag flag
		if @flags and @flags[flag]
			@flags[flag] = no
			@dom:classList.remove(flag)

		return self


###

Creating a plain class for our todos

###

class Todo

	var id = 0

	prop title
	prop completed
	prop editing

	def initialize title, completed = no
		@id = id++
		@title = title
		@completed = completed
		@editing = no

	def id
		@id

	# returns a unique string that will change whenever
	# anything changes on the todo
	def hash
		"" + @title + @completed + @editing

	def toJSON
		{title: title, completed: completed}


# this way of caching is not the 'Imba way' - it is merely a very simple way
# to do something similar to React 'shouldComponentUpdate'. You can implement
# this however you want - you merely try to figure out whether anything have
# changed inside tag#commit, and then rerender if it has.
tag todo < li

	def commit
		# commit is always called when a node is rendered as part of an outer tree
		# this is where we decide whether to cascade the render through to inner
		# parts of this.
		if @hash != object.hash
			@hash = object.hash
			render


	def render
		var todo = @object

		<self .completed=(object.completed) .editing=(object.editing) >
			<div.view>
				<label :dblclick=['edit',object]> object.title
				<input.toggle type='checkbox' :tap=['toggle',object] checked=(object.completed)>
				<button.destroy :tap=['drop',object]>
			if object.editing
				<edit-todo[object].edit type='text'>

	# onkeydown from inner element cascade through
	def onkeydown e
		e.halt
		blur if e.which == ENTER_KEY
		cancel if e.which == ESCAPE_KEY

		
		
tag new-todo-input < input

	def onkeydown e
		if e.which == ENTER_KEY
			#app.add value.trim
			value = ""


tag edit-todo < input

	def onkeydown e
		e.halt
		blur if e.which == ENTER_KEY
		cancel if e.which == ESCAPE_KEY

	def onfocusout
		object.editing ? submit : #app.render

	def commit
		return self if object.editing == @active

		if @active = object.editing
			value = object.title
			setTimeout(&,10) do focus
		self

	def submit
		object.editing = no
		value.trim ? #app.rename(object,value.trim) : #app.drop(object)
		self

	def cancel
		object.editing = no
		blur


tag #app

	def hash
		window:location:hash

	def awaken
		load
		window.addEventListener 'hashchange' do render
		render
		self

	def todos
		Todos

	def remaining
		todos.filter(|todo| !todo.completed )

	def completed
		todos.filter(|todo| todo.completed )

	def dirty
		persist
		render

	def add title
		if title.trim
			Todos.push(Todo.new(title.trim))
			dirty
		self
		
	def toggle todo
		todo.completed = !todo.completed
		dirty

	def toggleAll e
		for todo in todos
			todo.completed = e.target.checked
		dirty

	def edit todo
		todo.editing = yes
		dirty

	# rename a todo
	def rename todo, title
		todo.title = title
		dirty

	# remove a todo from all lists
	def drop todo
		# simply removing it from the list of todos
		Todos = Todos.filter(|t| t != todo)
		dirty
	
	# remove all completed todos
	def clear
		Todos = Todos.filter(|todo| !todo.completed )
		$$(.toggle-all).checked = no
		dirty

	# load todos from localstorage
	def load
		var items = JSON.parse(localStorage.getItem('todos-imba') or '[]')
		Todos = items.map do |item| Todo.new(item:title, item:completed)
		self

	# persist todos to localstorage
	def persist
		var json = JSON.stringify(Todos)
		localStorage.setItem('todos-imba',@json = json) if json != @json
		self

	# this is the method that actually takes care of rendering the whole app
	# Imba has a very efficient way of caching the actual elements.
	# this method can easily be called every frame without any performance
	# degradation at all. 
	#
	# A low-end mbp retina (safari 9.0) can render this example 30000 ops/sec
	# or 500 ops/frame. With this kind of performance there is little
	# need for the added complexity of registering listeners, tracking
	# dependencies, or manually calling render.
	def render
		var all = todos
		var active = remaining
		var done = completed
		var items = {'#/completed': done, '#/active': active}[hash] or all		

		<self>
			<header.header>
				<h1> "todos"
				<new-todo-input.new-todo type='text' placeholder='What needs to be done?'>

			if all:length > 0
				<section.main>
					<input.toggle-all type='checkbox' :change='toggleAll'>
					<ul.todo-list>
						for todo in items
							<todo[todo]@{todo.id}>

				<footer.footer>
					<span.todo-count>
						<strong> "{active:length} "
						active:length == 1 ? 'item left' : 'items left'
					<ul.filters>
						<li> <a .selected=(items == all)    href='#/'> 'All'
						<li> <a .selected=(items == active) href='#/active'> 'Active'
						<li> <a .selected=(items == done)   href='#/completed'> 'Completed'

					if done:length > 0
						<button.clear-completed :tap='clear'> 'Clear completed'

		

($$(.todoapp) or $$(body)).append #app

###

DEMO

###