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
function createDom(fiber){ // fiber代表了一个工作单元，是一个对象，包含了元素的DOM节点，元素的属性，元素的子元素等信息
    const dom = fiber.type === 'TEXT_ELEMENT'?document.createTextNode(''):document.createElement(element.type)  // 这里需要对文本元素做处理，在 DOM 结构中，文本内容不能直接作为元素节点。如果元素类型是文本，我们需要创建一个文本节点而不是常规节点
    const isProperty = key => key !== 'children'  // 判断key是否是children 原因是children的处理方式和其他属性不同
    Object.keys(fiber.props)  // 获取fiber节点的所有属性
        .filter(isProperty)  // 过滤掉children属性
        .forEach(name => {
            dom[name] = fiber.props[name]  // 将元素的属性赋值给DOM节点
        }
    )
    return dom; // 这行代码返回创建的DOM节点
}
/*
目的：此函数标志着渲染阶段的结束，开始将虚拟DOM的变更应用到实际DOM上。它首先调用commitWork来递归地处理所有需要更新的Fiber节点，然后清空wipRoot，表明当前的渲染任务已经完成。
* */
function commitRoot(){
    // 待办事项，将模式（modes，可能是某些react的特性，如concurrent mode）应用到dom
    commitWork(wipRoot.child) // 开始提交工作，从wipRoot的child开始提交
    currentRoot = wipRoot // currentRoot代表了当前已经提交到DOM上的fiber树的根，wipeRoot则代表了正在构建或更新但尚未提交的新版本的fiber树的根
    wipRoot = null // 提交完根节点后，将wipRoot置为null，表示没有下一个工作单元了，当前渲染周期已经完成，这里清空了wipRoot
}
/*
目的：递归地将Fiber树的变更应用到DOM树上，包括添加、更新或删除DOM元素。
逻辑：
首先，通过检查fiber是否为空来决定是否继续递归。如果为空，则返回，结束当前分支的处理。
接着，获取当前Fiber节点的父节点的DOM元素（domParent），并尝试将当前Fiber节点的DOM（fiber.dom）添加到该父节点中。注意，这里的appendChild调用在原始代码中缺少了参数，正确的调用应该是domParent.appendChild(fiber.dom)。
之后，分别递归调用commitWork处理当前Fiber的子节点和兄弟节点，确保整个子树都被正确地处理。
* */
function commitWork(fiber){
    if(!fiber){
        // fiber节点为null，表示已经提交完所有工作了，没有下一个工作单元了，渲染流程结束
        return
    }
    const domParent = fiber.parent.dom  // 获取父节点的DOM节点
    domParent.appendChild(fiber.dom) // 将当前fiber节点的DOM节点添加到父节点的DOM节点中
    commitWork(fiber.child) // 递归提交子节点
    commitWork(fiber.sibling) // 递归提交兄弟节点
}
function render(element,container){ // element是一个react元素，container是一个DOM节点
    wipRoot = {  // 初始化下一个工作单元
        dom: container,  // 将dom节点挂载到react元素上
        props: {children: [element]},  // 元素的属性，表示当前工作单元的子元素是elemen
        // alternate 本质是一个指针，指向当前fiber节点对应的上一次渲染周期中的fiber节点，用于连接两个连续渲染周期中对应fiber节点的桥梁，用于实现高效的dom更新策略、支持并发渲染以及优化
        // 主要用于比较和复用，在开始新一个渲染周期时，框架会新创建一个fiber树（wipRoot），但是alternate属性就指向了上一轮的fiber树（currentRoot），这样做的目的是为了可以在新的渲染过程中与之前的fiber树做比较，找出变化最小的变更集，较少实际dom操作，提高性能
        // 同时alternate可以记住每个fiber节点的前一个状态，使得中断和恢复成为可能，甚至在必要时候可以回滚到之前的稳定状态
        alternate:currentRoot
    }
    nextUnitOfWork = wipRoot  // 将刚创建的工作单元赋值给下一个工作单元，在这个渲染流程中，nextUnitOfWork是一个全局(或在渲染上下文中)维护的指针，指向当前需要执行的下一个Fiber节点，初始化他的wipRoot代表渲染流程将从此Fiber节点开始执行
    requestIdleCallback(workLoop)
}
// 构建调度器
let nextUnitOfWork = null // 下一个待处理的工作单元。可以是一个react元素，也可以是一个函数组件等
let currentRoot = null
let wipRoot = null  // 正在工作的fiber节点
function workLoop(deadLine){  // 这里做了一个循环，用于在浏览器空闲时间时执行任务

    let shouldYield = false  // 是否需要让出控制权，如果shouldYield为true，表示需要让出控制权
    while(nextUnitOfWork && !shouldYield){  // 再有待处理的工作单元，而且不需要让出控制权时，执行任务
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork) // 执行任务
        shouldYield = deadLine.timeRemaining() < 1 // 判断浏览器的空闲时间是否不足1ms，如果是，就需要让出控制权
    }
    if (!nextUnitOfWork && wipRoot){  // 这里意味着没有下一个待处理的工作单元(fiber节点)，这意味着所有的工作单元都已经完成，可以提交根节点
        commitRoot()
    }
    requestIdleCallback(workLoop) // 让浏览器在空闲时间执行workLoop
}
requestIdleCallback(workLoop) // 让浏览器在空闲时间执行workLoop
function performUnitOfWork(fiber){
    // TODO
    if (!fiber.dom){ // 判断是否存在dom节点
        fiber.dom = createDom(fiber) // 不存在则调用createDom函数创建dom节点，并且赋值给fiber.dom
    }
    const elements = fiber.props.children  // 获取fiber的子元素
    reconcileChildren(fiber,elements)

    // 判断是否有子节点
    if (fiber.child){
        // 如果有，则返回第一个子节点，并且作为下一个待处理的工作单元
        return fiber.child
    }
    let nextFiber = fiber // 下一个待处理的工作单元
    // 在fiber节点没有子节点的情况下，寻找下一个待处理的工作单元
    while (nextFiber){
        // 判断是否有兄弟节点
        if (nextFiber.sibling){
            // 有的话返回兄弟节点，并作为下一个待处理的工作单元
            return nextFiber.sibling
        }
        // 向上回溯，寻找父节点的兄弟节点，作为下一个待处理的工作单元
        nextFiber = nextFiber.parent
    }
}

function reconcileChildren(wipFiber,elements){
    let index = 0
    let oblFiber = wipFiber.alternate && wipFiber.alternate.child
    while (index  < elements.length || oblFiber !== null){ // 遍历每一个子元素
        const element  = elements[index]
        // 为没一个子元素创建一个fiber节点
        const newFiber ={
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null
        }
        // 如果是第一个子元素
        if (index === 0){
            // 将新创建的fiber节点赋值给fiber.child
            fiber.child = newFiber
        }else{
            // 将新的fiber节点链接到前一个子元素的sibling属性上（也就是兄弟节点）
            prevSibling.sibling = newFiber
        }
        // 更新prevSibling为新的fiber节点
        prevSibling = newFiber
        index++
    }
}



