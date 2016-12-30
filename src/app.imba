require 'imba'

var ESCAPE_KEY = 27
var ENTER_KEY = 13

# Define a simple class for our data objects
class Todo

	var id = 0

	prop title
	prop completed

	def initialize title, completed = no
		@id = id++
		@title = title
		@completed = completed

	def id
		@id

	def toJSON
		{title: title, completed: completed}


# custom tag type for todo that inherits from li
tag todo < li

	def render
		<self .completed=(data.completed)>
			<div.view>
				<label :dblclick='edit'> data.title
				<input.toggle type='checkbox' :tap='toggle' checked=(data.completed)>
				<button.destroy :tap='drop'>
			<input@edit type='text' :blur='save'>

	def toggle
		up(%app).toggle(data)

	# triggered by doubleclicking the title
	# sets value if input to current title
	# and flags the <todo> with .editing.
	def edit
		flag('editing')
		@edit.value = data.title
		@edit.focus

	def save
		if hasFlag('editing')
			unflag('editing')
			up(%app).rename(data,@edit.value)

	def drop
		up(%app).drop(data)

	def onkeydown e
		switch e.which
			when ENTER_KEY then save
			when ESCAPE_KEY then unflag('editing')


tag app

	def hash
		window:location:hash

	def build
		load
		window.addEventListener 'hashchange' do scheduler.mark
		schedule

	def render
		var items = data
		var active = remaining
		var done = completed
		

		if hash == '#/completed'
			items = done
		elif hash == '#/active'
			items = active

		<self>
			<header.header>
				<h1> "todos"
				<form> <input@adder.new-todo type='text' placeholder='What needs to be done?'>

			if data.len > 0
				<section.main>
					<input.toggle-all type='checkbox' :change='toggleAll' checked=(active.len == 0)>
					<ul.todo-list>
						for todo in items
							<todo[todo]@{todo.id}>

				<footer.footer>
					<span.todo-count>
						<strong> "{active.len} "
						active.len == 1 ? 'item left' : 'items left'
					<ul.filters>
						<li> <a .selected=(items == data)    href='#/'> 'All'
						<li> <a .selected=(items == active) href='#/active'> 'Active'
						<li> <a .selected=(items == done)   href='#/completed'> 'Completed'

					if done.len > 0
						<button.clear-completed :tap='archive'> 'Clear completed'

	def remaining
		data.filter(|todo| !todo.completed )

	def completed
		data.filter(|todo| todo.completed )

	def dirty
		persist

	def add title
		if title.trim
			data.push Todo.new(title.trim)
			persist
		
	def toggle todo
		todo.completed = !todo.completed
		persist

	def toggleAll e
		for todo in data
			todo.completed = e.target.checked
		persist

	# rename a todo
	# drops the todo if title is blank
	def rename todo, title
		todo.title = title.trim
		todo.title ? persist : drop(todo)

	# remove a todo from collection
	def drop todo
		# simply removing it from the list of todos
		data = data.filter(|t| t != todo)
		persist
	
	# remove all completed todos from collection
	def archive
		data = remaining
		persist

	# load todos from localstorage
	def load
		var items = JSON.parse(window:localStorage.getItem('todos-imba') or '[]')
		data = items.map do |item| Todo.new(item:title, item:completed)
		self

	# persist todos to localstorage
	def persist
		var json = JSON.stringify(data)
		if json != @json
			window:localStorage.setItem('todos-imba',@json = json)

		self

	def onsubmit e
		e.cancel.halt
		add @adder.value
		@adder.value = ''


Imba.mount(<app#app>,document.querySelector('.todoapp'))
