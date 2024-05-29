const yukiice = {
    createElement,
}
const element = yukiice.createElement(
        'h1',
        {id: 'foo'},
        'Hello',
        yukiice.createElement('span', null, 'world')
    ) //  生成的结构为 <h1 id="foo"> Hello <span> world </span> < /h1>

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
            children: []  // 文本节点没有子节点，所以是一个空数组
        }
    }
}




