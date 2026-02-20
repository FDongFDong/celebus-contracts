// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC1271} from "../../common/IERC1271.sol";

library SignatureVerifier {
    bytes4 private constant ERC1271_MAGICVALUE = 0x1626ba7e;

    function isValidSignature(
        address signer,
        bytes32 digest,
        bytes calldata sig
    ) internal view returns (bool) {
        if (signer.code.length == 0) {
            (
                address recovered,
                ECDSA.RecoverError err,
                bytes32 errArg
            ) = ECDSA.tryRecoverCalldata(digest, sig);
            errArg; // suppress unused warning
            return err == ECDSA.RecoverError.NoError && recovered == signer;
        }

        (bool ok, bytes memory ret) = signer.staticcall(
            abi.encodeWithSelector(
                IERC1271.isValidSignature.selector,
                digest,
                sig
            )
        );
        // ABI-encoded bytes4 is padded to 32 bytes.
        return ok && ret.length >= 32 && bytes4(ret) == ERC1271_MAGICVALUE;
    }
}
