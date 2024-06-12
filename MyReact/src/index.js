const yukiice = {
    createElement,
    render
}
const element = yukiice.createElement(
        'h1',
        {id: 'foo'},
        'Hello',
        yukiice.createElement('span', null, 'world')  // 这个是第三个参数，表示元素的子元素
) //  生成的结构为 <h1 id="foo"> Hello <span> world </span> < /h1>
const container = document.getElementById('root')
yukiice.render(element,container)
// 生成的element对象如下
function createElement(type, props, ...children) {
    return {
        type,  // 元素的类型，为字符串或者函数
        // 如果是字符串，表示该元素是一个原生DOM节点，type就是DOM节点的类型，如div、span等
        // 如果是函数，表示该元素是一个组件，type就是组件函数
        props: { //  包含了元素的属性和子元素
            ...props,
            children: children.map(child =>
                typeof child === 'object'   // 在react中，元素的子元素可以是一个对象，也可以是一个字符串，如果元素是一个对象，那么就代表他是一个react元素，可以直接使用
                    ? child
                    : createTextElement(child)  // 否则则创建一个文本节点，节点的内容就是child
            )
        }
    }
}
function createTextElement(text) {
    return {
        type: 'TEXT_ELEMENT',  // 表示该元素是一个文本节点，是一个特殊的元素
        props: {
            nodeValue: text,  // 文本节点的内容
            children: []  // 文本节点没有子节点，所以是一个空数组  这一步可以省略，因为文本节点没有子节点，所以不需要children属性，这样可以减少一些内存的消耗
        }
    }
}

// 生成的render函数如下
function render(element,container){
    const dom = element.type === 'TEXT_ELEMENT'?document.createTextNode(''):document.createElement(element.type)  // 这里需要对文本元素做处理，在 DOM 结构中，文本内容不能直接作为元素节点。如果元素类型是文本，我们需要创建一个文本节点而不是常规节点
    const isProperty = key => key !== 'children'  // 判断key是否是children 原因是children的处理方式和其他属性不同
    Object.keys(element.props)  // 获取元素的所有属性
        .filter(isProperty)  // 过滤掉children属性
        .forEach(name => {
            dom[name] = element.props[name]  // 将元素的属性赋值给DOM节点
        }
    )
    element.props.children.forEach(child =>  // 遍历子元素
        render(child,dom)  // 递归渲染子元素
    )
    container.appendChild(dom)  // 将DOM节点添加到容器中
}

// 构建调度器
let nextUnitOfWork = null // 下一个待处理的工作单元。可以是一个react元素，也可以是一个函数组件等
function workLoop(deadLine){  // 这里做了一个循环，用于在浏览器空闲时间时执行任务
    let shouldYield = false  // 是否需要让出控制权，如果shouldYield为true，表示需要让出控制权
    while(nextUnitOfWork && !shouldYield){  // 再有待处理的工作单元，而且不需要让出控制权时，执行任务
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork) // 执行任务
        shouldYield = deadLine.timeRemaining() < 1 // 判断浏览器的空闲时间是否不足1ms，如果是，就需要让出控制权
    }
    requestIdleCallback(workLoop) // 让浏览器在空闲时间执行workLoop
}
requestIdleCallback(workLoop) // 让浏览器在空闲时间执行workLoop
function performUnitOfWork(nextUnitOfWork){
    // TODO
}




