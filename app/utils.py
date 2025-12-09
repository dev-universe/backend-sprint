def success(data=None, message="success"):
    return {
        "success": True,
        "message": message,
        "data": data
    }


def error(message="error", status=400):
    return {
        "success": False,
        "message": message,
        "data": None
    }, status