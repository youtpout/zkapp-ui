extends VBoxContainer


# Declare member variables here. Examples:
# var a = 2
# var b = "text"
var _callback_ref = JavaScript.create_callback(self, "_my_callback")

# Called when the node enters the scene tree for the first time.
func _ready():
	var mina = JavaScript.get_interface("mina")
	# Call the `window.Notification.requestPermission` method which returns a JavaScript
	# Promise, and bind our callback to it.
	mina.requestAccounts().then(_callback_ref)


# Called every frame. 'delta' is the elapsed time since the previous frame.
#func _process(delta):
#	pass


func _my_callback(args):
	# Call preventDefault and set the `returnValue` property of the DOM event.
	print(args[0][0]);
