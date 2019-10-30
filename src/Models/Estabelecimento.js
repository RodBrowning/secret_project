const mongoose = require("mongoose")
const Endereco = require('./Endereco')
const Usuario = require('./Usuario')
const Conta = require('./Conta')
const Cardapio = require('./Cardapio')
    

const EstabelecimentoSchema = new mongoose.Schema({
    nome: String,
    telefone: [Number],
    endereco: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Endereco'
    },
    contas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conta'
    }],
    usuarios: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }],
    cardapio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cardapio'
    }
})

EstabelecimentoSchema.post('findOneAndDelete', async estabelecimentoRemovido => {
    let id_estabelecimentoRemovido = estabelecimentoRemovido._id,
        id_endereco = estabelecimentoRemovido.endereco,
        usuariosDoEstabelecimento = estabelecimentoRemovido.usuarios,
        contasDoEstabelecimento = estabelecimentoRemovido.contas,
        id_cardapio = estabelecimentoRemovido.cardapio
    
    await removerEndereco(id_endereco)

    usuariosDoEstabelecimento.map(async id_usuario => {
        await removerReferenciaNoModel(Usuario, id_usuario, id_estabelecimentoRemovido)  
    })

    contasDoEstabelecimento.map(async conta => {
        await removerContaRelacionadaAoEstabelecimento(conta._id)
    })
    
    await removerReferenciaNoModel(Cardapio, id_cardapio, id_estabelecimentoRemovido)
})

async function removerEndereco(id_endereco){
    let endereco = await Endereco.deleteOne({_id: id_endereco })
    return endereco
}
async function removerContaRelacionadaAoEstabelecimento(id_conta){
    let conta = await Conta.findOneAndDelete({_id: id_conta})
    return conta
}
async function removerReferenciaNoModel(Model, id_documento, id_estabelecimentoRemovido){
    let documento  = await Model.findOne({_id: id_documento}),
        estabelecimentosDoDocumento = documento.estabelecimentos

    if(estabelecimentosDoDocumento.length == 1){
        documento = await Model.findOneAndDelete({_id: id_documento})
    } else {
        let indexDoEstabelecimentoRemovido = estabelecimentosDoDocumento.indexOf(id_estabelecimentoRemovido)
        estabelecimentosDoDocumento.splice(indexDoEstabelecimentoRemovido,1)
        let novaListaDeEstabelecimentos = estabelecimentosDoDocumento
        documento = await Model.findByIdAndUpdate({_id: id_documento}, {$set: {estabelecimentos: novaListaDeEstabelecimentos}},{new:true})
    }
    return documento
}


module.exports = mongoose.model("Estabelecimento",EstabelecimentoSchema)






async function removerReferenciaNoUsuario(id_usuario, id_estabelecimentoRemovido){
    let usuario = await Usuario.findOne({_id: id_usuario}),
        estabelecimentosDoUsuario = usuario.estabelecimentos

    if(estabelecimentosDoUsuario.length == 1){
        usuario = await Usuario.findOneAndDelete({_id: usuario._id})
    } else {
        let novaListaDeEstabelecimentos = estabelecimentosDoUsuario.filter(id_estabelecimento =>{
            return !id_estabelecimento.equals(id_estabelecimentoRemovido)
        })
        usuario = await Usuario.findByIdAndUpdate({_id: usuario._id},{$set:{estabelecimentos: novaListaDeEstabelecimentos}},{new: true})
    }
    return usuario
}
async function removerReferenciaNoCardapio(id_cardapio, id_estabelecimentoRemovido){
    let cardapio  = await Cardapio.findOne({_id: id_cardapio}),
        estabelecimentosDoCardapio = cardapio.estabelecimentos

    if(estabelecimentosDoCardapio.length == 1){
        cardapio = await Cardapio.findOneAndDelete({_id: id_cardapio})
    } else {
        let novaListaDeEstabelecimentos = estabelecimentosDoCardapio.filter(id_estabelecimento =>{
            return !id_estabelecimento.equals(id_estabelecimentoRemovido)
        })
        cardapio = await Cardapio.findByIdAndUpdate({_id: id_cardapio}, {$set: {estabelecimentos: novaListaDeEstabelecimentos}},{new:true})
    }
    return cardapio
}
