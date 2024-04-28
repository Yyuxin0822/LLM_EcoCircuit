def maplistx(currentx):
    """
        if currentx =[-1, 0, 1, 2, 4]
        return [-1, 0, 1, 2, 3]
        return a list of the same length of 1 arithmetic progression, but please ensure that 0 stays in the same position of the list
    """
    currentx=sorted(list(set(currentx)))
    zero_index = currentx.index(0)
    newx = [None] * len(currentx)
    newx[zero_index] = 0
    for i in range(zero_index - 1, -1, -1):
        newx[i] = newx[i + 1] - 1
    for i in range(zero_index + 1, len(currentx)):
        newx[i] = newx[i - 1] + 1
    return currentx,newx

def mapX(currentx):
    currentx,newx= maplistx(currentx)
    mapXdict = dict(zip(currentx,newx))
    return mapXdict

def maplistx2(currentx: list, use_zero_index=False) -> list:
    """
    Returns a list of the same length as the input where all integers have been
    transformed into a continuous arithmetic progression starting from 0 or the index of 0
    in the original list. Floats are adjusted to maintain their decimal offset relative to
    their preceding integer.

    Args:
    currentx (list): List of integers and floats.
    use_zero_index (bool): If True, starts the progression from the index of the first zero in the list.
                           If False, starts the progression from the first element.

    Returns:
    list: A new list of numbers in arithmetic progression.
    """
    # Determine the starting index for the progression
    if use_zero_index:
        try:
            start_index = currentx.index(0)  # start from the first zero if present
        except ValueError:
            start_index = 0  # if no zero found, default to the start of the list
    else:
        start_index = 0

    # Initialize the output list with the same length as the input
    newx = [None] * len(currentx)

    # Set the start of the progression
    newx[start_index] = 0

    # Forward pass to set values after the start index
    last_integer_index = start_index
    for i in range(start_index + 1, len(currentx)):
        if isinstance(currentx[i], int):
            newx[i] = newx[last_integer_index] +1

            last_integer_index = i
        else:  # Handle floats
            print(f"this is float {currentx[i]}")
            newx[i] = newx[last_integer_index] + round(currentx[i]%1,1)

    # Backward pass to set values before the start index
    last_integer_index = start_index
    for i in range(start_index - 1, -1, -1):
        if isinstance(currentx[i], int):
            newx[i] = newx[last_integer_index] - 1
            last_integer_index = i
        else:  # Handle floats
            newx[i] = newx[last_integer_index] - round(currentx[i]%1,1)

    return newx

# Test cases


if __name__ == '__main__':
    print(maplistx2([-1, -0.9, 0, 2, 3, 4], use_zero_index=True))  # [-1, 0, 1, 2, 3]
    print(maplistx2([-1, 0, 2, 3, 4], use_zero_index=False))  # [0, 1, 2, 3, 4]
    print(maplistx2([0, 4, 4.1, 4.2, 4.3, 6], use_zero_index=False))  # [0, 1, 1.1, 1.2, 1.3, 2]
    print(maplistx2([0, 3, 4, 4.1, 4.2, 4.3, 5], use_zero_index=False))  # [0, 1, 2, 2.1, 2.2, 2.3, 3]

