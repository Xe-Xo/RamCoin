
const EC = require('elliptic').ec;
const BN = require('bn.js');
const bip39 = require('bip39')
bip39.setDefaultWordlist('english')

const ec = new EC('secp256k1');

const crypto = require('crypto');

const cryptoHash = (...inputs) => {
  const hash = crypto.createHash('sha256');

  hash.update(inputs.map(input => JSON.stringify(input)).sort().join(' '));

  return hash.digest('hex');
};

const verifySignature = ({ publicKey, data, signature }) => {
  const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');

  return keyFromPublic.verify(cryptoHash(data), signature);
};

function hexToMemoryPhrase(hexstring){
  return bip39.entropyToMnemonic(hexstring).split(' ');
};

function hexToKeyPair(hexstring){
  const privateKey = new BN(hexstring, "hex");
  const keyPair = ec.keyFromPrivate(privateKey);
  return keyPair
}

function keypairToMemoryPhrase(keyPair){
  const privateKey = keyPair.getPrivate();
  const publicKey = keyPair.getPublic().encode('hex');
  const memoryPhrase = hexToMemoryPhrase(privateKey.toString('hex'));
  return memoryPhrase;
};

function keypairToHex(keyPair){
  const privateKey = keyPair.getPrivate();
  const publicKey = keyPair.getPublic().encode('hex');
  return privateKey.toString('hex')
}

function memoryphraseToKeyPair(memoryPhrase){
  const mnemonic = memoryPhrase.join(' ');
  const privateKeyHex = bip39.mnemonicToEntropy(mnemonic);
  const privateKey = new BN(privateKeyHex, "hex");
  const keyPair = ec.keyFromPrivate(privateKey);
  const publicKey = keyPair.getPublic().encode('hex');
  return keyPair;
};

module.exports = { ec, verifySignature, cryptoHash, keypairToMemoryPhrase, hexToMemoryPhrase, memoryphraseToKeyPair,hexToKeyPair,keypairToHex};