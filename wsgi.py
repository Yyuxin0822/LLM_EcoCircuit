from flaskr import create_app, socketio

app = create_app()

if __name__ == '__main__':
    socketio.run(app, port=8000,debug=True)
