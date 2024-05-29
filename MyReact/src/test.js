const element = {
    type: 'h1',
    props:{
        title: 'foo',
        children: 'Hello'
    }
}  // 该对象是一个元素，具有两个属性的对象，type和props

const node = document.createElement(element.type)  // 这里为子节点创建了一个DOM节点
node['title'] = element.props.title  // 设置节点的title属性
console.log(node.title)  //

const text =document.createTextNode('')  // 创建一个文本节点
text['nodeValue'] = element.props.children  // 设置文本节点的nodeValue属性

node.appendChild(text)  // 将文本节点添加到DOM节点中
document.body.appendChild(node)  // 将DOM节点添加到body中

