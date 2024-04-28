class Node(object):
    """A class representing a node in flow lists"""
    
    def __init__(self, node_type, node_matrix, node_sys):
        self.node_type = node_type
        self.node_matrix = node_matrix
        self.node_sys = node_sys
    
    def getnodex(self):
        return self.node_matrix[0]
    
    def getnodey(self):
        return self.node_matrix[1]
    
    def __str__(self):
        return self.node_type
    
    def __repr__(self):
        return "<Node %s>" % self.node_type